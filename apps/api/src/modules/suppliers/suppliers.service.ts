import logger from '../../lib/logger.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';
import { suppliersRepository } from './suppliers.repository.js';
import { Supplier, SupplierStatus } from '@prisma/client';

export class SuppliersService {
  async createSupplier(data: CreateSupplierDto): Promise<Supplier> {
    // Check if supplier with this name already exists
    const existingSupplier = await suppliersRepository.findByName(data.name);
    if (existingSupplier) {
      throw new ConflictError('Supplier with this name already exists');
    }

    // Validate email format if provided
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestError('Invalid email format');
      }
    }

    const supplier = await suppliersRepository.create(data);
    logger.info('Supplier created', {
      supplierId: supplier.id,
      supplierName: supplier.name,
    });

    return supplier;
  }

  async getSuppliersWithPagination(filters: {
    search?: string;
    status?: SupplierStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Supplier[]; total: number; page: number; limit: number; pages: number }> {
    const result = await suppliersRepository.findAll(filters);
    const pages = Math.ceil(result.total / filters.limit);

    return {
      data: result.data,
      total: result.total,
      page: filters.page,
      limit: filters.limit,
      pages,
    };
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const supplier = await suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    return supplier;
  }

  async updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    // Check if supplier exists
    const supplier = await suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Validate email format if provided
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestError('Invalid email format');
      }
    }

    const updatedSupplier = await suppliersRepository.update(id, data);
    logger.info('Supplier updated', {
      supplierId: id,
      changes: Object.keys(data),
    });

    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    // Check if supplier exists
    const supplier = await suppliersRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Check for active purchase orders
    const hasActivePOs = await suppliersRepository.hasActivePurchaseOrders(id);
    if (hasActivePOs) {
      throw new BadRequestError('Cannot delete supplier with active purchase orders');
    }

    await suppliersRepository.softDelete(id);
    logger.info('Supplier deleted', {
      supplierId: id,
      supplierName: supplier.name,
    });
  }
}

export const suppliersService = new SuppliersService();
