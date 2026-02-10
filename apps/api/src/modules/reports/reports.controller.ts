import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreditLimitReportService } from './credit-limit-report.service.js';
import { CashFlowService } from './cash-flow.service.js';
import { expenseService } from '../expenses/expenses.service.js';
import logger from '../../lib/logger.js';

const prisma = new PrismaClient();

export class ReportsController {
  private creditLimitReportService: CreditLimitReportService;
  private cashFlowService: CashFlowService;

  constructor() {
    this.creditLimitReportService = new CreditLimitReportService(prisma);
    this.cashFlowService = new CashFlowService(prisma);
  }

  /**
   * GET /api/reports/credit-limits
   * Get clients with high credit utilization
   */
  getCreditLimits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 80;

      if (threshold < 0 || threshold > 100) {
        return res.status(400).json({
          success: false,
          message: 'Threshold must be between 0 and 100',
        });
      }

      const clients = await this.creditLimitReportService.getHighUtilizationClients(threshold);

      logger.info('Credit limit report generated', {
        threshold,
        clientCount: clients.length,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: clients,
        threshold,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/reports/credit-limits/summary
   * Get credit limit summary statistics
   */
  getCreditLimitSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.creditLimitReportService.getCreditLimitSummary();

      logger.info('Credit limit summary generated', {
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/reports/tax-summary
   * Get tax summary for a date range (Story 3.5)
   */
  getTaxSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      const summary = await this.creditLimitReportService.getTaxSummary(dateFrom, dateTo);

      logger.info('Tax summary report generated', {
        dateFrom,
        dateTo,
        totalTax: summary.totalTaxCollected,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/reports/expense-summary
   * Get expense summary grouped by category for a date range (Story 3.7)
   */
  getExpenseSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom
        ? new Date(req.query.dateFrom as string)
        : new Date(new Date().getFullYear(), 0, 1); // Default: start of current year
      const dateTo = req.query.dateTo
        ? new Date(req.query.dateTo as string)
        : new Date(); // Default: today

      const summary = await expenseService.getExpenseSummary(dateFrom, dateTo);

      logger.info('Expense summary report generated', {
        dateFrom,
        dateTo,
        totalExpenses: summary.totalExpenses,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/reports/cash-flow
   * Get cash flow report for a date range (Story 3.8)
   */
  getCashFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom
        ? new Date(req.query.dateFrom as string)
        : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo
        ? new Date(req.query.dateTo as string)
        : new Date();

      const report = await this.cashFlowService.getCashFlowReport(dateFrom, dateTo);

      logger.info('Cash flow report generated', {
        dateFrom,
        dateTo,
        netCashFlow: report.netCashFlow,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };
}
