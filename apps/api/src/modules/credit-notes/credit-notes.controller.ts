import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreditNotesService } from './credit-notes.service.js';
import { createCreditNoteSchema } from './dto/create-credit-note.dto.js';
import { voidCreditNoteSchema } from './dto/void-credit-note.dto.js';
import { UnauthorizedError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';

const prisma = new PrismaClient();

export class CreditNotesController {
  private service: CreditNotesService;

  constructor() {
    this.service = new CreditNotesService(prisma);
  }

  createCreditNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createCreditNoteSchema.parse(req.body);
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const creditNote = await this.service.createCreditNote(validatedData, userId);

      logger.info('Credit note created via API', {
        creditNoteId: creditNote?.id,
        userId,
      });

      res.status(201).json({
        status: 'success',
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  };

  getCreditNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        clientId: req.query.clientId as string | undefined,
        invoiceId: req.query.invoiceId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await this.service.getCreditNotes(filters);

      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getCreditNoteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const creditNote = await this.service.getCreditNoteById(id);

      res.json({
        status: 'success',
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  };

  voidCreditNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = voidCreditNoteSchema.parse(req.body);
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const creditNote = await this.service.voidCreditNote(id, userId, validatedData);

      logger.info('Credit note voided via API', { creditNoteId: id, userId });

      res.json({
        status: 'success',
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  };

  applyCreditNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const creditNote = await this.service.applyCreditNote(id, userId);

      logger.info('Credit note applied via API', { creditNoteId: id, userId });

      res.json({
        status: 'success',
        data: creditNote,
      });
    } catch (error) {
      next(error);
    }
  };
}
