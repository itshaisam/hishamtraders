import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';
import { BadRequestError, ValidationError } from '../../utils/errors';
import { createSupplierSchema } from './dto/create-supplier.dto';
import { updateSupplierSchema } from './dto/update-supplier.dto';
import { supplierFilterSchema } from './dto/supplier-filter.dto';
import { suppliersService } from './suppliers.service';

export class SuppliersController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSupplierSchema.parse(req.body);
      const supplier = await suppliersService.createSupplier(data);

      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = supplierFilterSchema.parse(req.query);
      const result = await suppliersService.getSuppliersWithPagination({
        search: filters.search,
        status: filters.status as any,
        page: filters.page,
        limit: filters.limit,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.getSupplierById(id);

      res.status(200).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateSupplierSchema.parse(req.body);
      const supplier = await suppliersService.updateSupplier(id, data);

      res.status(200).json({
        success: true,
        data: supplier,
        message: 'Supplier updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await suppliersService.deleteSupplier(id);

      res.status(200).json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const suppliersController = new SuppliersController();
