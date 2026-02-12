import { Request, Response } from 'express';
import { BankAccountsService } from './bank-accounts.service.js';

export class BankAccountsController {
  private service: BankAccountsService;

  constructor() {
    this.service = new BankAccountsService();
  }

  getBankAccounts = async (_req: Request, res: Response) => {
    try {
      const accounts = await this.service.getBankAccounts();
      res.json({ status: 'success', data: accounts });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
