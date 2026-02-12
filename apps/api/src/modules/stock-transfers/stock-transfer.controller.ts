import { Request, Response, NextFunction } from 'express';
import { StockTransferService } from './stock-transfer.service.js';
import { TransferStatus } from '@prisma/client';

export class StockTransferController {
  private service: StockTransferService;

  constructor() {
    this.service = new StockTransferService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const transfer = await this.service.create(req.body, userId);
      res.status(201).json({ success: true, message: 'Stock transfer created', data: transfer });
    } catch (error) { next(error); }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sourceWarehouseId, destinationWarehouseId, status, search, page = '1', limit = '10' } = req.query;
      const result = await this.service.getAll({
        sourceWarehouseId: sourceWarehouseId as string,
        destinationWarehouseId: destinationWarehouseId as string,
        status: status as TransferStatus,
        search: search as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) { next(error); }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transfer = await this.service.getById(req.params.id);
      res.json({ success: true, data: transfer });
    } catch (error) { next(error); }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const transfer = await this.service.approve(req.params.id, userId);
      res.json({ success: true, message: 'Stock transfer approved', data: transfer });
    } catch (error) { next(error); }
  };

  dispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const transfer = await this.service.dispatch(req.params.id, userId);
      res.json({ success: true, message: 'Stock transfer dispatched', data: transfer });
    } catch (error) { next(error); }
  };

  receive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { items } = req.body;
      const transfer = await this.service.receive(req.params.id, items || [], userId);
      res.json({ success: true, message: 'Stock transfer received', data: transfer });
    } catch (error) { next(error); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { reason } = req.body;
      const transfer = await this.service.cancel(req.params.id, reason, userId);
      res.json({ success: true, message: 'Stock transfer cancelled', data: transfer });
    } catch (error) { next(error); }
  };
}
