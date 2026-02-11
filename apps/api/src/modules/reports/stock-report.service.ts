import { PrismaClient } from '@prisma/client';

interface StockReportFilters {
  warehouseId?: string;
  categoryId?: string;
  status?: 'in-stock' | 'low-stock' | 'out-of-stock';
  page?: number;
  limit?: number;
}

export class StockReportService {
  constructor(private prisma: PrismaClient) {}

  async getStockReport(filters: StockReportFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.categoryId) where.product = { categoryId: filters.categoryId };

    // Get all inventory for counting/filtering by stock status
    const allInventory = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: { category: true },
        },
        warehouse: true,
      },
    });

    // Apply status filter
    let filtered = allInventory;
    if (filters.status === 'in-stock') {
      filtered = allInventory.filter((i) => i.quantity > i.product.reorderLevel);
    } else if (filters.status === 'low-stock') {
      filtered = allInventory.filter(
        (i) => i.quantity > 0 && i.quantity <= i.product.reorderLevel
      );
    } else if (filters.status === 'out-of-stock') {
      filtered = allInventory.filter((i) => i.quantity <= 0);
    }

    const total = filtered.length;

    // Pagination
    const paginated = filtered.slice(skip, skip + limit);

    const data = paginated.map((inv) => {
      const costPrice = parseFloat(inv.product.costPrice.toString());
      const qty = inv.quantity;
      let status = 'In Stock';
      if (qty <= 0) status = 'Out of Stock';
      else if (qty <= inv.product.reorderLevel) status = 'Low Stock';

      return {
        productId: inv.productId,
        sku: inv.product.sku,
        productName: inv.product.name,
        categoryName: inv.product.category?.name || 'Uncategorized',
        warehouseName: inv.warehouse.name,
        quantity: qty,
        reorderLevel: inv.product.reorderLevel,
        costPrice,
        value: qty * costPrice,
        status,
      };
    });

    const totalValue = filtered.reduce(
      (sum, inv) => sum + inv.quantity * parseFloat(inv.product.costPrice.toString()),
      0
    );

    return {
      data,
      summary: {
        totalItems: total,
        totalValue: Math.round(totalValue * 100) / 100,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStockValuation() {
    const inventory = await this.prisma.inventory.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    const categoryMap = new Map<string, { name: string; quantity: number; value: number }>();

    for (const inv of inventory) {
      const catId = inv.product.categoryId || 'uncategorized';
      const catName = inv.product.category?.name || 'Uncategorized';
      const costPrice = parseFloat(inv.product.costPrice.toString());
      const value = inv.quantity * costPrice;

      const existing = categoryMap.get(catId) || { name: catName, quantity: 0, value: 0 };
      existing.quantity += inv.quantity;
      existing.value += value;
      categoryMap.set(catId, existing);
    }

    const totalValue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.value, 0);

    const data = Array.from(categoryMap.entries()).map(([catId, cat]) => ({
      categoryId: catId,
      categoryName: cat.name,
      totalQuantity: cat.quantity,
      totalValue: Math.round(cat.value * 100) / 100,
      percentage: totalValue > 0 ? Math.round((cat.value / totalValue) * 10000) / 100 : 0,
    }));

    data.sort((a, b) => b.totalValue - a.totalValue);

    return data;
  }
}
