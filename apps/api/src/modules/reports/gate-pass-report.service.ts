import { PrismaClient, Prisma } from '@prisma/client';

interface GatePassReportFilters {
  warehouseId?: string;
  status?: string;
  purpose?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class GatePassReportService {
  constructor(private prisma: PrismaClient) {}

  async getActivityReport(filters: GatePassReportFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.GatePassWhereInput = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status as any;
    if (filters.purpose) where.purpose = filters.purpose as any;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.gatePass.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          issuer: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gatePass.count({ where }),
    ]);

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSummary(filters: { warehouseId?: string; dateFrom?: string; dateTo?: string }) {
    const where: Prisma.GatePassWhereInput = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    // Count by status
    const [pending, approved, inTransit, completed, cancelled, total] = await Promise.all([
      this.prisma.gatePass.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.gatePass.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.gatePass.count({ where: { ...where, status: 'IN_TRANSIT' } }),
      this.prisma.gatePass.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.gatePass.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.gatePass.count({ where }),
    ]);

    // Count by purpose
    const [sale, transfer, returnPurpose, other] = await Promise.all([
      this.prisma.gatePass.count({ where: { ...where, purpose: 'SALE' } }),
      this.prisma.gatePass.count({ where: { ...where, purpose: 'TRANSFER' } }),
      this.prisma.gatePass.count({ where: { ...where, purpose: 'RETURN' } }),
      this.prisma.gatePass.count({ where: { ...where, purpose: 'OTHER' } }),
    ]);

    // Count by warehouse (top warehouses)
    const warehouseCounts = await this.prisma.gatePass.groupBy({
      by: ['warehouseId'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Fetch warehouse names
    const warehouseIds = warehouseCounts.map((w) => w.warehouseId);
    const warehouses = await this.prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, name: true },
    });
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));

    const byWarehouse = warehouseCounts.map((w) => ({
      warehouseId: w.warehouseId,
      warehouseName: warehouseMap.get(w.warehouseId) || 'Unknown',
      count: w._count.id,
    }));

    return {
      total,
      byStatus: { pending, approved, inTransit, completed, cancelled },
      byPurpose: { sale, transfer, return: returnPurpose, other },
      byWarehouse,
    };
  }
}
