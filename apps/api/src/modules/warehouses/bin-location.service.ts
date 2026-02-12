import { prisma } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';

export class BinLocationService {
  async listBins(warehouseId: string, filters: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    // Validate warehouse exists
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { warehouseId };
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { zone: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.binLocation.findMany({
        where,
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.binLocation.count({ where }),
    ]);

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createBin(warehouseId: string, data: { code: string; zone?: string; description?: string }) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    if (!data.code || data.code.trim().length === 0) {
      throw new BadRequestError('Bin code is required');
    }

    try {
      const bin = await prisma.binLocation.create({
        data: {
          warehouseId,
          code: data.code.trim().toUpperCase(),
          zone: data.zone?.trim() || null,
          description: data.description?.trim() || null,
        },
      });
      logger.info('Bin location created', { id: bin.id, warehouseId, code: bin.code });
      return bin;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestError(`Bin code "${data.code}" already exists in this warehouse`);
      }
      throw error;
    }
  }

  async updateBin(warehouseId: string, binId: string, data: { code?: string; zone?: string; description?: string; isActive?: boolean }) {
    const bin = await prisma.binLocation.findFirst({ where: { id: binId, warehouseId } });
    if (!bin) throw new NotFoundError('Bin location not found');

    try {
      const updated = await prisma.binLocation.update({
        where: { id: binId },
        data: {
          ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
          ...(data.zone !== undefined && { zone: data.zone?.trim() || null }),
          ...(data.description !== undefined && { description: data.description?.trim() || null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
      logger.info('Bin location updated', { id: binId, warehouseId });
      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestError(`Bin code "${data.code}" already exists in this warehouse`);
      }
      throw error;
    }
  }

  async deleteBin(warehouseId: string, binId: string) {
    const bin = await prisma.binLocation.findFirst({ where: { id: binId, warehouseId } });
    if (!bin) throw new NotFoundError('Bin location not found');

    // Soft delete by setting isActive = false
    await prisma.binLocation.update({
      where: { id: binId },
      data: { isActive: false },
    });
    logger.info('Bin location deactivated', { id: binId, warehouseId });
  }
}
