import { Request, Response } from 'express';
import { PaymentsService } from './payments.service.js';
import { PaymentMethod, PaymentReferenceType } from '@prisma/client';
import { AuthRequest } from '../../types/auth.types.js';
import { AuditService } from '../../services/audit.service.js';

export class PaymentsController {
  private service: PaymentsService;

  constructor() {
    this.service = new PaymentsService();
  }

  /**
   * POST /api/payments/supplier
   * Create a supplier payment
   */
  createSupplierPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentReferenceType, referenceId, amount, method, date, notes } =
        req.body;

      const payment = await this.service.createSupplierPayment({
        supplierId,
        paymentReferenceType: paymentReferenceType as PaymentReferenceType,
        referenceId,
        amount: parseFloat(amount),
        method: method as PaymentMethod,
        date: new Date(date),
        notes,
        recordedBy: req.user!.userId,
      });

      // Audit log
      await AuditService.log({
        userId: req.user!.userId,
        action: 'CREATE',
        entityType: 'Payment',
        entityId: payment.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        notes: `Supplier payment of ${amount} recorded for supplier ${supplierId}`,
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Supplier payment recorded successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to record supplier payment',
      });
    }
  };

  /**
   * GET /api/payments/supplier
   * Get all supplier payments with filters
   */
  getSupplierPayments = async (req: Request, res: Response) => {
    try {
      const { supplierId, method, paymentReferenceType, dateFrom, dateTo, page, limit } =
        req.query;

      const filters: any = {
        supplierId: supplierId as string,
        method: method as PaymentMethod,
        paymentReferenceType: paymentReferenceType as PaymentReferenceType,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const result = await this.service.getSupplierPayments(filters);

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch supplier payments',
      });
    }
  };

  /**
   * GET /api/payments/supplier/:supplierId/history
   * Get payment history for a specific supplier
   */
  getSupplierPaymentHistory = async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;

      const payments = await this.service.getSupplierPaymentHistory(supplierId);

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch supplier payment history',
      });
    }
  };

  /**
   * GET /api/payments/po/:poId/balance
   * Get PO outstanding balance
   */
  getPOBalance = async (req: Request, res: Response) => {
    try {
      const { poId } = req.params;

      const balance = await this.service.getPOBalance(poId);

      res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to fetch PO balance',
      });
    }
  };
}
