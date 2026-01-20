import { Request, Response, NextFunction } from 'express';
import { StockMovementService } from './stock-movement.service.js';
import { MovementType } from '@prisma/client';

export class StockMovementController {
  private service: StockMovementService;

  constructor() {
    this.service = new StockMovementService();
  }

  /**
   * GET /api/inventory/movements
   * Get stock movements with filters and pagination
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        productId,
        productVariantId,
        warehouseId,
        movementType,
        dateFrom,
        dateTo,
        page,
        pageSize,
      } = req.query;

      // Parse query params
      const filters: any = {};

      if (productId) {
        filters.productId = productId as string;
      }

      if (productVariantId) {
        filters.productVariantId = productVariantId as string;
      }

      if (warehouseId) {
        filters.warehouseId = warehouseId as string;
      }

      if (movementType) {
        filters.movementType = movementType as MovementType;
      }

      if (dateFrom) {
        filters.dateFrom = new Date(dateFrom as string);
      }

      if (dateTo) {
        filters.dateTo = new Date(dateTo as string);
      }

      if (page) {
        filters.page = parseInt(page as string, 10);
      }

      if (pageSize) {
        filters.pageSize = parseInt(pageSize as string, 10);
      }

      const result = await this.service.getMovementsWithBalance(filters);

      res.json({
        success: true,
        data: result.movements,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/inventory/movements/product/:productId
   * Get movements for a specific product
   */
  getByProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const { productVariantId } = req.query;

      const movements = await this.service.getProductMovements(
        productId,
        productVariantId as string | undefined
      );

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/inventory/movements/warehouse/:warehouseId
   * Get movements for a specific warehouse
   */
  getByWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { warehouseId } = req.params;

      const movements = await this.service.getWarehouseMovements(warehouseId);

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/inventory/movements/product/:productId/warehouse/:warehouseId
   * Get movements for a specific product in a specific warehouse
   */
  getByProductAndWarehouse = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { productId, warehouseId } = req.params;
      const { productVariantId } = req.query;

      const movements = await this.service.getProductWarehouseMovements(
        productId,
        warehouseId,
        productVariantId as string | undefined
      );

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  };
}
