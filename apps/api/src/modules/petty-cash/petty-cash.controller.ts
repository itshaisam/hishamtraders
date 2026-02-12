import { Request, Response } from 'express';
import { PettyCashService } from './petty-cash.service.js';
import { AuthRequest } from '../../types/auth.types.js';

export class PettyCashController {
  private service: PettyCashService;

  constructor() {
    this.service = new PettyCashService();
  }

  getBalance = async (_req: Request, res: Response) => {
    try {
      const result = await this.service.getBalance();
      res.json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };

  createAdvance = async (req: AuthRequest, res: Response) => {
    try {
      const { amount, bankAccountId } = req.body;

      if (!amount || !bankAccountId) {
        return res.status(400).json({
          status: 'error',
          message: 'amount and bankAccountId are required',
        });
      }

      const entry = await this.service.createAdvance(
        parseFloat(amount),
        bankAccountId,
        req.user!.userId
      );

      res.status(201).json({
        status: 'success',
        data: entry,
        message: 'Petty cash advance created successfully',
      });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };

  getTransactions = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = await this.service.getTransactions(limit);
      res.json({ status: 'success', data: transactions });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
