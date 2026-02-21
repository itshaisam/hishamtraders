import { Request, Response } from 'express';
import logger from '../../lib/logger.js';
import { GoodsReceiptsService } from './goods-receipts.service.js';
import { createGRNSchema } from './dto/create-grn.dto.js';
import { addGRNCostSchema } from './dto/add-grn-cost.dto.js';
import { z } from 'zod';

const grnFilterSchema = z.object({
  search: z.string().optional().default(''),
  poId: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  warehouseId: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  status: z
    .string()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v))
    .pipe(z.enum(['COMPLETED', 'CANCELLED']).optional()),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export class GoodsReceiptsController {
  constructor(private service: GoodsReceiptsService) {}

  async list(req: Request, res: Response) {
    try {
      const filters = grnFilterSchema.parse(req.query);
      const result = await this.service.list(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error listing GRNs', { error });
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors, message: 'Invalid filters' });
      }
      res.status(500).json({ success: false, message: 'Failed to fetch goods receipts' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const grn = await this.service.getById(req.params.id);
      res.status(200).json({ success: true, data: grn });
    } catch (error: any) {
      logger.error('Error fetching GRN', { error });
      if (error.message === 'Goods Receipt Note not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Failed to fetch goods receipt' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = createGRNSchema.parse(req.body);
      const grn = await this.service.create(data, req.user?.userId || '');

      logger.info('GRN created via API', { userId: req.user?.userId, grnId: grn?.id });

      res.status(201).json({
        success: true,
        data: grn,
        message: 'Goods Receipt Note created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating GRN', { error });
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors, message: 'Validation failed' });
      }
      if (error.message === 'Purchase order not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({ success: false, message: error.message || 'Failed to create goods receipt' });
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const grn = await this.service.cancel(req.params.id, req.user?.userId || '');

      logger.info('GRN cancelled via API', { userId: req.user?.userId, grnId: req.params.id });

      res.status(200).json({
        success: true,
        data: grn,
        message: 'Goods Receipt Note cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Error cancelling GRN', { error });
      if (error.message === 'Goods Receipt Note not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({ success: false, message: error.message || 'Failed to cancel goods receipt' });
    }
  }

  async addCost(req: Request, res: Response) {
    try {
      const data = addGRNCostSchema.parse(req.body);
      const cost = await this.service.addCost(req.params.id, data, req.user?.userId || '');

      res.status(201).json({
        success: true,
        data: cost,
        message: 'Cost added to Goods Receipt Note successfully',
      });
    } catch (error: any) {
      logger.error('Error adding cost to GRN', { error });
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors, message: 'Validation failed' });
      }
      if (error.message === 'Goods Receipt Note not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(400).json({ success: false, message: error.message || 'Failed to add cost' });
    }
  }

  async getLandedCost(req: Request, res: Response) {
    try {
      const result = await this.service.getLandedCost(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Error fetching GRN landed cost', { error });
      if (error.message === 'Goods Receipt Note not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Failed to fetch landed cost' });
    }
  }
}
