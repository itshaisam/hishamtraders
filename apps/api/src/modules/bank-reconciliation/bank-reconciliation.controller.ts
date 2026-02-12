import { Request, Response } from 'express';
import { BankReconciliationService } from './bank-reconciliation.service.js';
import { AuthRequest } from '../../types/auth.types.js';

export class BankReconciliationController {
  private service: BankReconciliationService;

  constructor() {
    this.service = new BankReconciliationService();
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const { bankAccountId, status, page, limit } = req.query;
      const result = await this.service.getAll({
        bankAccountId: bankAccountId as string,
        status: status as 'IN_PROGRESS' | 'COMPLETED' | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({
        status: 'success',
        data: result.sessions,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const { bankAccountId, statementDate, statementBalance } = req.body;

      if (!bankAccountId || !statementDate || statementBalance === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'bankAccountId, statementDate, and statementBalance are required',
        });
      }

      const session = await this.service.create(
        { bankAccountId, statementDate, statementBalance: parseFloat(statementBalance) },
        req.user!.userId
      );

      res.status(201).json({ status: 'success', data: session });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const session = await this.service.getById(req.params.id);
      res.json({ status: 'success', data: session });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  addItem = async (req: Request, res: Response) => {
    try {
      const { description, statementAmount, statementDate } = req.body;

      if (!description || statementAmount === undefined || !statementDate) {
        return res.status(400).json({
          status: 'error',
          message: 'description, statementAmount, and statementDate are required',
        });
      }

      const item = await this.service.addItem(req.params.id, {
        description,
        statementAmount: parseFloat(statementAmount),
        statementDate,
      });

      res.status(201).json({ status: 'success', data: item });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  getUnmatchedTransactions = async (req: Request, res: Response) => {
    try {
      const transactions = await this.service.getUnmatchedTransactions(req.params.id);
      res.json({ status: 'success', data: transactions });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  matchItem = async (req: Request, res: Response) => {
    try {
      const { itemId, journalEntryLineId } = req.body;

      if (!itemId || !journalEntryLineId) {
        return res.status(400).json({
          status: 'error',
          message: 'itemId and journalEntryLineId are required',
        });
      }

      const item = await this.service.matchItem(req.params.id, itemId, journalEntryLineId);
      res.json({ status: 'success', data: item });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  unmatchItem = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.body;

      if (!itemId) {
        return res.status(400).json({ status: 'error', message: 'itemId is required' });
      }

      const item = await this.service.unmatchItem(req.params.id, itemId);
      res.json({ status: 'success', data: item });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  deleteItem = async (req: Request, res: Response) => {
    try {
      await this.service.deleteItem(req.params.id, req.params.itemId);
      res.json({ status: 'success', message: 'Item deleted' });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  complete = async (req: Request, res: Response) => {
    try {
      const session = await this.service.complete(req.params.id);
      res.json({ status: 'success', data: session });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };
}
