import { Request, Response, NextFunction } from 'express';
import { WarehousesService } from './warehouses.service.js';
import { createWarehouseSchema } from './dto/create-warehouse.dto.js';
import { updateWarehouseSchema } from './dto/update-warehouse.dto.js';
import { WarehouseStatus } from '@prisma/client';

export class WarehousesController {
  private service: WarehousesService;

  constructor() {
    this.service = new WarehousesService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = createWarehouseSchema.parse(req.body);
      const userId = (req as any).user.id;

      const warehouse = await this.service.create(validatedData, userId);

      res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, page = '1', limit = '10' } = req.query;

      const filters = {
        search: search as string | undefined,
        status: status as WarehouseStatus | undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await this.service.findAll(filters);

      res.json({
        success: true,
        message: 'Warehouses fetched successfully',
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const warehouse = await this.service.findById(id);

      res.json({
        success: true,
        message: 'Warehouse fetched successfully',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = updateWarehouseSchema.parse(req.body);
      const userId = (req as any).user.id;

      const warehouse = await this.service.update(id, validatedData, userId);

      res.json({
        success: true,
        message: 'Warehouse updated successfully',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.service.delete(id);

      res.json({
        success: true,
        message: 'Warehouse deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
