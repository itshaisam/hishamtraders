import { Request, Response, NextFunction } from 'express';
import { StockCountService } from './stock-count.service.js';
import { CountStatus } from '@prisma/client';

export class StockCountController {
  private service: StockCountService;

  constructor() {
    this.service = new StockCountService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const result = await this.service.create(req.body, userId);
      res.status(201).json({ success: true, message: 'Stock count created', data: result });
    } catch (error) { next(error); }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { warehouseId, status, search, page = '1', limit = '10' } = req.query;
      const result = await this.service.getAll({
        warehouseId: warehouseId as string,
        status: status as CountStatus,
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) { next(error); }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getById(req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const result = await this.service.startCount(req.params.id, userId);
      res.json({ success: true, message: 'Stock count started', data: result });
    } catch (error) { next(error); }
  };

  updateItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { items } = req.body;
      const result = await this.service.updateItems(req.params.id, items || [], userId);
      res.json({ success: true, message: 'Items updated', data: result });
    } catch (error) { next(error); }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const result = await this.service.complete(req.params.id, userId);
      res.json({ success: true, message: 'Stock count completed', data: result });
    } catch (error) { next(error); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const result = await this.service.cancel(req.params.id, userId);
      res.json({ success: true, message: 'Stock count cancelled', data: result });
    } catch (error) { next(error); }
  };
}
