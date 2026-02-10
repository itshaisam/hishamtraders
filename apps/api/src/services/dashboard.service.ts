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
    return {
      pendingReceipts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      lowStockProducts: [],
    };
  }

  async getSalesStats() {
    return {
      todaysSalesTotal: 0,
      todaysSalesCount: 0,
      creditLimitAlerts: 0,
      recentInvoicesCount: 0,
      recentInvoices: [],
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
