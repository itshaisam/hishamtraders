import { PrismaClient, Warehouse, WarehouseStatus, GatePassMode } from '@prisma/client';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto.js';

const prisma = new PrismaClient();

export class WarehousesRepository {
  async create(data: CreateWarehouseDto, userId: string): Promise<Warehouse> {
    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location || null,
        city: data.city || null,
        status: (data.status as WarehouseStatus) || 'ACTIVE',
        createdBy: userId,
      },
    });
    return warehouse;
  }

  async findAll(filters: {
    search?: string;
    status?: WarehouseStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Warehouse[]; total: number }> {
    const { search, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { city: { contains: searchLower } },
        { location: { contains: searchLower } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Warehouse | null> {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
    });
    return warehouse;
  }

  async update(id: string, data: UpdateWarehouseDto, userId: string): Promise<Warehouse> {
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
    return warehouse;
  }

  async delete(id: string): Promise<void> {
    await prisma.warehouse.delete({
      where: { id },
    });
  }

  async checkHasStock(id: string): Promise<boolean> {
    // For MVP, we don't have stock tracking yet
    // This will be implemented in later stories
    // For now, always return false (no stock)
    return false;
  }

  async updateGatePassMode(id: string, gatePassMode: GatePassMode, userId: string): Promise<Warehouse> {
    return prisma.warehouse.update({
      where: { id },
      data: { gatePassMode, updatedBy: userId },
    });
  }
}
