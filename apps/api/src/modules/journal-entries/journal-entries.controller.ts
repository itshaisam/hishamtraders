import { Request, Response, NextFunction } from 'express';
import { journalEntryService } from './journal-entries.service.js';
import { createJournalEntrySchema } from './dto/create-journal-entry.dto.js';
import { updateJournalEntrySchema } from './dto/update-journal-entry.dto.js';
import { journalEntryFilterSchema } from './dto/journal-entry-filter.dto.js';
import { AuthRequest } from '../../types/auth.types.js';

export class JournalEntryController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const validatedData = createJournalEntrySchema.parse(req.body);
      const entry = await journalEntryService.create(validatedData, req.user.userId);

      res.status(201).json({
        status: 'success',
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = journalEntryFilterSchema.parse(req.query);
      const result = await journalEntryService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result.entries,
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

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await journalEntryService.getById(id);

      res.status(200).json({
        status: 'success',
        data: entry,
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
      const validatedData = updateJournalEntrySchema.parse(req.body);
      const entry = await journalEntryService.update(id, validatedData, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  async post(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const entry = await journalEntryService.post(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: entry,
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
      await journalEntryService.delete(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Journal entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const journalEntryController = new JournalEntryController();
