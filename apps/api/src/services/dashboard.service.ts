import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class DashboardService {
  async getAdminStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      // Stock value
      inventoryWithCost,
      // Today's revenue
      todayRevenueAgg,
      // Month's revenue
      monthRevenueAgg,
      // Total receivables
      receivablesAgg,
      // Low stock & out of stock (raw SQL for grouped inventory vs reorderLevel)
      stockAlerts,
      // Pending containers
      pendingContainers,
      // Top products this month
      topProductsRaw,
      // Recent activity
      recentActivity,
      // Revenue trend (last 30 days)
      revenueTrendRaw,
      // POs for payables calculation
      activePOs,
    ] = await Promise.all([
      // 1. Stock value: inventory with product costPrice
      prisma.inventory.findMany({
        where: { quantity: { gt: 0 } },
        select: {
          quantity: true,
          product: { select: { costPrice: true } },
          productVariant: { select: { costPrice: true } },
        },
      }),

      // 2. Today's revenue
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          invoiceDate: { gte: todayStart },
          status: { not: 'VOIDED' },
        },
      }),

      // 3. Month's revenue
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          invoiceDate: { gte: monthStart },
          status: { not: 'VOIDED' },
        },
      }),

      // 4. Total receivables
      prisma.client.aggregate({
        _sum: { balance: true },
        where: { balance: { gt: 0 } },
      }),

      // 5. Low stock & out of stock via raw SQL
      prisma.$queryRaw<Array<{ productId: string; totalQty: bigint; reorderLevel: number }>>`
        SELECT i.productId, SUM(i.quantity) as totalQty, p.reorderLevel
        FROM inventory i
        JOIN products p ON p.id = i.productId
        WHERE p.status = 'ACTIVE'
        GROUP BY i.productId, p.reorderLevel
      `,

      // 6. Pending containers (POs in transit)
      prisma.purchaseOrder.count({
        where: { status: 'IN_TRANSIT' },
      }),

      // 7. Top 5 products by revenue this month
      prisma.invoiceItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        where: {
          invoice: {
            invoiceDate: { gte: monthStart },
            status: { not: 'VOIDED' },
          },
        },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),

      // 8. Recent activity
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true } } },
      }),

      // 9. Revenue trend (last 30 days) via raw SQL for date grouping
      prisma.$queryRaw<Array<{ date: string; total: Prisma.Decimal }>>`
        SELECT DATE(invoiceDate) as date, SUM(total) as total
        FROM invoices
        WHERE invoiceDate >= ${thirtyDaysAgo}
          AND status != 'VOIDED'
        GROUP BY DATE(invoiceDate)
        ORDER BY date ASC
      `,

      // 10. Active POs for payables
      prisma.purchaseOrder.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { id: true, totalAmount: true },
      }),
    ]);

    // Calculate stock value
    const stockValue = inventoryWithCost.reduce((sum, inv) => {
      const cost = inv.productVariant
        ? parseFloat(inv.productVariant.costPrice.toString())
        : parseFloat(inv.product.costPrice.toString());
      return sum + inv.quantity * cost;
    }, 0);

    // Calculate payables: PO totals minus supplier payments
    let totalPayables = 0;
    if (activePOs.length > 0) {
      const poIds = activePOs.map(po => po.id);
      const poPaidAmounts = await prisma.payment.groupBy({
        by: ['referenceId'],
        where: {
          paymentType: 'SUPPLIER',
          paymentReferenceType: 'PO',
          referenceId: { in: poIds },
        },
        _sum: { amount: true },
      });

      totalPayables = activePOs.reduce((sum, po) => {
        const paid = poPaidAmounts.find(p => p.referenceId === po.id)?._sum.amount || 0;
        return sum + parseFloat(po.totalAmount.toString()) - parseFloat(paid.toString());
      }, 0);
    }

    // Calculate low stock and out of stock
    // Also get products with NO inventory records at all
    const allActiveProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
    const productsWithInventory = new Set(stockAlerts.map(s => s.productId));

    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const row of stockAlerts) {
      const totalQty = Number(row.totalQty);
      if (totalQty === 0) {
        outOfStockCount++;
      } else if (totalQty <= row.reorderLevel) {
        lowStockCount++;
      }
    }

    // Products with no inventory records at all are also out of stock
    const productsWithNoInventory = allActiveProducts - productsWithInventory.size;
    outOfStockCount += productsWithNoInventory;

    // Resolve top product names
    const topProductIds = topProductsRaw.map(tp => tp.productId);
    const topProductDetails = topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];

    const topProducts = topProductsRaw.map(tp => {
      const product = topProductDetails.find(p => p.id === tp.productId);
      return {
        productId: tp.productId,
        name: product?.name || 'Unknown',
        sku: product?.sku || '',
        quantitySold: tp._sum.quantity || 0,
        revenue: parseFloat((tp._sum.total || 0).toString()),
      };
    });

    // Format revenue trend
    const revenueTrend = (revenueTrendRaw as Array<{ date: Date | string; total: Prisma.Decimal }>).map(row => ({
      date: row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date).split('T')[0],
      revenue: parseFloat(row.total.toString()),
    }));

    // Format recent activity
    const formattedActivity = recentActivity.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userName: log.user.name,
      timestamp: log.timestamp,
      notes: log.notes,
    }));

    return {
      stockValue,
      todayRevenue: parseFloat((todayRevenueAgg._sum.total || 0).toString()),
      monthRevenue: parseFloat((monthRevenueAgg._sum.total || 0).toString()),
      totalReceivables: parseFloat((receivablesAgg._sum.balance || 0).toString()),
      totalPayables,
      lowStockCount,
      outOfStockCount,
      pendingContainers,
      topProducts,
      recentActivity: formattedActivity,
      revenueTrend,
    };
  }

  async getWarehouseStats() {
    const [
      inventoryWithProduct,
      allActiveProducts,
      pendingReceipts,
      recentMovements,
    ] = await Promise.all([
      // Inventory with product + category for stock value & category breakdown
      prisma.inventory.findMany({
        where: { quantity: { gt: 0 } },
        select: {
          quantity: true,
          product: {
            select: {
              id: true,
              costPrice: true,
              categoryId: true,
              category: { select: { name: true } },
            },
          },
          productVariant: { select: { costPrice: true } },
        },
      }),

      // All active products with inventory for low/out of stock
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          sku: true,
          reorderLevel: true,
          category: { select: { name: true } },
          inventory: { select: { quantity: true } },
        },
      }),

      // Pending receipts (POs in transit)
      prisma.purchaseOrder.count({ where: { status: 'IN_TRANSIT' } }),

      // Recent stock movements
      prisma.stockMovement.findMany({
        take: 10,
        orderBy: { movementDate: 'desc' },
        select: {
          id: true,
          movementType: true,
          quantity: true,
          movementDate: true,
          notes: true,
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } },
        },
      }),
    ]);

    // Stock value total & by category
    let stockValue = 0;
    const categoryValues: Record<string, number> = {};

    inventoryWithProduct.forEach(inv => {
      const cost = inv.productVariant
        ? parseFloat(inv.productVariant.costPrice.toString())
        : parseFloat(inv.product.costPrice.toString());
      const value = inv.quantity * cost;
      stockValue += value;

      const categoryName = inv.product.category?.name || 'Uncategorized';
      categoryValues[categoryName] = (categoryValues[categoryName] || 0) + value;
    });

    const stockByCategory = Object.entries(categoryValues)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    // Low stock & out of stock
    const lowStockProducts: Array<{
      productId: string;
      name: string;
      sku: string;
      category: string;
      currentQty: number;
      reorderLevel: number;
    }> = [];
    const outOfStockProducts: Array<{
      productId: string;
      name: string;
      sku: string;
      category: string;
    }> = [];

    // Count distinct products in stock
    const productsInStock = new Set<string>();

    allActiveProducts.forEach(p => {
      const totalQty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      if (totalQty > 0) productsInStock.add(p.id);

      if (totalQty === 0) {
        outOfStockProducts.push({
          productId: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name || 'Uncategorized',
        });
      } else if (totalQty <= p.reorderLevel) {
        lowStockProducts.push({
          productId: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category?.name || 'Uncategorized',
          currentQty: totalQty,
          reorderLevel: p.reorderLevel,
        });
      }
    });

    // Format recent movements
    const formattedMovements = recentMovements.map(m => ({
      id: m.id,
      type: m.movementType,
      productName: m.product.name,
      productSku: m.product.sku,
      quantity: m.quantity,
      userName: m.user.name,
      date: m.movementDate,
      notes: m.notes,
    }));

    return {
      totalItemsInStock: productsInStock.size,
      stockValue,
      stockByCategory,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 100),
      outOfStockCount: outOfStockProducts.length,
      outOfStockProducts: outOfStockProducts.slice(0, 100),
      pendingReceipts,
      recentMovements: formattedMovements,
    };
  }

  async getSalesStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySales,
      todayCount,
      weekSales,
      weekCount,
      monthSales,
      monthCount,
      overdueInvoices,
      topClientsRaw,
      creditAlertClients,
      weeklyTrendRaw,
    ] = await Promise.all([
      // Today's sales total
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { invoiceDate: { gte: todayStart }, status: { not: 'VOIDED' } },
      }),
      // Today's sales count
      prisma.invoice.count({
        where: { invoiceDate: { gte: todayStart }, status: { not: 'VOIDED' } },
      }),
      // Week's sales total
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { invoiceDate: { gte: weekStart }, status: { not: 'VOIDED' } },
      }),
      // Week's sales count
      prisma.invoice.count({
        where: { invoiceDate: { gte: weekStart }, status: { not: 'VOIDED' } },
      }),
      // Month's sales total
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { invoiceDate: { gte: monthStart }, status: { not: 'VOIDED' } },
      }),
      // Month's sales count
      prisma.invoice.count({
        where: { invoiceDate: { gte: monthStart }, status: { not: 'VOIDED' } },
      }),
      // Overdue invoices
      prisma.invoice.findMany({
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: todayStart },
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          paidAmount: true,
          dueDate: true,
          client: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      // Top 5 clients by revenue this month
      prisma.invoice.groupBy({
        by: ['clientId'],
        _sum: { total: true },
        _count: true,
        where: {
          invoiceDate: { gte: monthStart },
          status: { not: 'VOIDED' },
        },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      // Credit limit alerts (>80% utilization)
      prisma.client.findMany({
        where: { status: 'ACTIVE', creditLimit: { gt: 0 } },
        select: { id: true, name: true, balance: true, creditLimit: true },
      }),
      // Weekly sales trend (last 7 days)
      prisma.$queryRaw<Array<{ date: Date | string; total: Prisma.Decimal; count: bigint }>>`
        SELECT DATE(invoiceDate) as date, SUM(total) as total, COUNT(*) as count
        FROM invoices
        WHERE invoiceDate >= ${weekStart}
          AND status != 'VOIDED'
        GROUP BY DATE(invoiceDate)
        ORDER BY date ASC
      `,
    ]);

    // Resolve top client names
    const topClientIds = topClientsRaw.map(tc => tc.clientId);
    const topClientDetails = topClientIds.length > 0
      ? await prisma.client.findMany({
          where: { id: { in: topClientIds } },
          select: { id: true, name: true },
        })
      : [];

    const topClients = topClientsRaw.map(tc => {
      const client = topClientDetails.find(c => c.id === tc.clientId);
      return {
        clientId: tc.clientId,
        name: client?.name || 'Unknown',
        revenue: parseFloat((tc._sum.total || 0).toString()),
        invoiceCount: tc._count,
      };
    });

    // Format overdue invoices with aging
    const formattedOverdue = overdueInvoices.map(inv => {
      const daysOverdue = Math.floor((todayStart.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client.name,
        total: parseFloat(inv.total.toString()),
        paidAmount: parseFloat(inv.paidAmount.toString()),
        outstanding: parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
        dueDate: inv.dueDate,
        daysOverdue,
      };
    });

    // Credit limit alerts
    const creditAlerts = creditAlertClients
      .map(c => {
        const balance = parseFloat(c.balance.toString());
        const limit = parseFloat(c.creditLimit.toString());
        const utilization = limit > 0 ? Math.round((balance / limit) * 100) : 0;
        return { clientId: c.id, name: c.name, balance, creditLimit: limit, utilization };
      })
      .filter(c => c.utilization > 80)
      .sort((a, b) => b.utilization - a.utilization);

    // Format weekly trend
    const weeklyTrend = (weeklyTrendRaw as Array<{ date: Date | string; total: Prisma.Decimal; count: bigint }>).map(row => ({
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0],
      revenue: parseFloat(row.total.toString()),
      count: Number(row.count),
    }));

    return {
      todaySalesTotal: parseFloat((todaySales._sum.total || 0).toString()),
      todaySalesCount: todayCount,
      weekSalesTotal: parseFloat((weekSales._sum.total || 0).toString()),
      weekSalesCount: weekCount,
      monthSalesTotal: parseFloat((monthSales._sum.total || 0).toString()),
      monthSalesCount: monthCount,
      topClients,
      overdueInvoices: formattedOverdue,
      overdueCount: formattedOverdue.length,
      overdueTotal: formattedOverdue.reduce((sum, inv) => sum + inv.outstanding, 0),
      creditAlerts,
      weeklyTrend,
    };
  }

  async getAccountantStats() {
    return {
      cashInflow: 0,
      cashOutflow: 0,
      totalReceivables: 0,
      totalPayables: 0,
      pendingPayments: 0,
    };
  }

  async getRecoveryStats() {
    return {
      totalOutstanding: 0,
      overdueClients: 0,
      collectedThisWeek: 0,
      overdueClientsList: [],
    };
  }
}
