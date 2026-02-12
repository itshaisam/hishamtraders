import { Request, Response, NextFunction } from 'express';
import { accountHeadService } from './account-heads.service.js';
import { createAccountHeadSchema } from './dto/create-account-head.dto.js';
import { updateAccountHeadSchema } from './dto/update-account-head.dto.js';
import { accountHeadFilterSchema } from './dto/account-head-filter.dto.js';
import { AuthRequest } from '../../types/auth.types.js';

export class AccountHeadController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const validatedData = createAccountHeadSchema.parse(req.body);
      const accountHead = await accountHeadService.create(validatedData, req.user.userId);

      res.status(201).json({
        status: 'success',
        data: accountHead,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = accountHeadFilterSchema.parse(req.query);
      const result = await accountHeadService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result.accountHeads,
        meta: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await accountHeadService.getTree();

      res.status(200).json({
        status: 'success',
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const accountHead = await accountHeadService.getById(id);

      res.status(200).json({
        status: 'success',
        data: accountHead,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const validatedData = updateAccountHeadSchema.parse(req.body);
      const accountHead = await accountHeadService.update(id, validatedData, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: accountHead,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await accountHeadService.delete(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Account head deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const accountHeadController = new AccountHeadController();
