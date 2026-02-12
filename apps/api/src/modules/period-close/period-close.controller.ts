import { Request, Response, NextFunction } from 'express';
import { PeriodCloseService } from './period-close.service.js';

const periodCloseService = new PeriodCloseService();

export class PeriodCloseController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await periodCloseService.list();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async closeMonth(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.body;
      if (!year || !month) {
        return res.status(400).json({ status: 'error', message: 'year and month are required' });
      }
      const userId = req.user?.userId;
      const data = await periodCloseService.closeMonth(Number(year), Number(month), userId);
      res.json({ status: 'success', data, message: 'Period closed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async reopen(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.userId;
      const data = await periodCloseService.reopen(id, reason, userId);
      res.json({ status: 'success', data, message: 'Period reopened successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMonthPnL(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.query;
      if (!year || !month) {
        return res.status(400).json({ status: 'error', message: 'year and month query params are required' });
      }
      const data = await periodCloseService.getMonthPnL(Number(year), Number(month));
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}
