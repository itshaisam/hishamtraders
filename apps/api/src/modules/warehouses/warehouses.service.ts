import { Warehouse, WarehouseStatus } from '@prisma/client';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import logger from '../../lib/logger';

export class WarehousesService {
  private repository: WarehousesRepository;

  constructor() {
    this.repository = new WarehousesRepository();
  }

  async create(data: CreateWarehouseDto, userId: string): Promise<Warehouse> {
    logger.info('Creating warehouse', { name: data.name, userId });

    try {
      const warehouse = await this.repository.create(data, userId);
      logger.info('Warehouse created successfully', { id: warehouse.id, name: warehouse.name });
      return warehouse;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestError('A warehouse with this name already exists');
      }
      logger.error('Error creating warehouse', { error: error.message });
      throw error;
    }
  }

  async findAll(filters: {
    search?: string;
    status?: WarehouseStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Warehouse[]; total: number; page: number; limit: number }> {
    logger.info('Fetching warehouses', { filters });

    const result = await this.repository.findAll(filters);

    return {
      ...result,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: string): Promise<Warehouse> {
    logger.info('Fetching warehouse by ID', { id });

    const warehouse = await this.repository.findById(id);

    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    return warehouse;
  }

  async update(id: string, data: UpdateWarehouseDto, userId: string): Promise<Warehouse> {
    logger.info('Updating warehouse', { id, userId });

    // Check if warehouse exists
    await this.findById(id);

    try {
      const warehouse = await this.repository.update(id, data, userId);
      logger.info('Warehouse updated successfully', { id: warehouse.id, name: warehouse.name });
      return warehouse;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestError('A warehouse with this name already exists');
      }
      logger.error('Error updating warehouse', { id, error: error.message });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    logger.info('Deleting warehouse', { id });

    // Check if warehouse exists
    await this.findById(id);

    // Check if warehouse has stock
    const hasStock = await this.repository.checkHasStock(id);
    if (hasStock) {
      throw new BadRequestError('Cannot delete warehouse with existing stock');
    }

    try {
      await this.repository.delete(id);
      logger.info('Warehouse deleted successfully', { id });
    } catch (error: any) {
      logger.error('Error deleting warehouse', { id, error: error.message });
      throw error;
    }
  }
}
