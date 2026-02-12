import { Request, Response, NextFunction } from 'express';
import { BinTransferService } from './bin-transfer.service.js';

export class BinTransferController {
  private service: BinTransferService;

  constructor() {
    this.service = new BinTransferService();
  }

  transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const result = await this.service.transfer(id, req.body, userId);
      res.json({ success: true, message: 'Bin transfer completed', data: result });
    } catch (error) {
      next(error);
    }
  };
}
