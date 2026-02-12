import { Request, Response, NextFunction } from 'express';
import { PrismaClient, GatePassStatus } from '@prisma/client';
import { GatePassService } from './gate-pass.service.js';
import { createGatePassSchema } from './dto/create-gate-pass.dto.js';
import { prisma } from '../../lib/prisma.js';

export class GatePassController {
  private service: GatePassService;

  constructor() {
    this.service = new GatePassService(prisma as unknown as PrismaClient);
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = createGatePassSchema.parse(req.body);
      const userId = (req as any).user.userId;

      const gatePass = await this.service.createGatePass(validatedData, userId);

      res.status(201).json({
        success: true,
        message: 'Gate pass created successfully',
        data: gatePass,
      });
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { warehouseId, status, purpose, dateFrom, dateTo, search, page = '1', limit = '10' } = req.query;

      const result = await this.service.getGatePasses({
        warehouseId: warehouseId as string | undefined,
        status: status as GatePassStatus | undefined,
        purpose: purpose as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        search: search as string | undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({
        success: true,
        message: 'Gate passes fetched successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const gatePass = await this.service.getGatePassById(id);

      res.json({
        success: true,
        message: 'Gate pass fetched successfully',
        data: gatePass,
      });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const gatePass = await this.service.approveGatePass(id, userId);

      res.json({
        success: true,
        message: 'Gate pass approved successfully',
        data: gatePass,
      });
    } catch (error) {
      next(error);
    }
  };

  dispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const gatePass = await this.service.dispatchGatePass(id, userId);

      res.json({
        success: true,
        message: 'Gate pass dispatched successfully',
        data: gatePass,
      });
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const gatePass = await this.service.completeGatePass(id, userId);

      res.json({
        success: true,
        message: 'Gate pass completed successfully',
        data: gatePass,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: 'Cancellation reason is required (minimum 3 characters)',
        });
        return;
      }

      const gatePass = await this.service.cancelGatePass(id, reason.trim(), userId);

      res.json({
        success: true,
        message: 'Gate pass cancelled successfully',
        data: gatePass,
      });
    } catch (error) {
      next(error);
    }
  };
}
