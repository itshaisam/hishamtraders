import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';
import { paymentTermsService } from './payment-terms.service.js';

export class PaymentTermsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentTerms = await paymentTermsService.getAllPaymentTerms();

      res.status(200).json({
        success: true,
        data: paymentTerms,
        message: 'Payment terms fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const paymentTerm = await paymentTermsService.getPaymentTermById(id);

      res.status(200).json({
        success: true,
        data: paymentTerm,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentTermsController = new PaymentTermsController();
