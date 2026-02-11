import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreditLimitReportService } from './credit-limit-report.service.js';
import { CashFlowService } from './cash-flow.service.js';
import { StockReportService } from './stock-report.service.js';
import { SalesReportService } from './sales-report.service.js';
import { PaymentReportService } from './payment-report.service.js';
import { ImportReportService } from './import-report.service.js';
import { ExpenseReportService } from './expense-report.service.js';
import { expenseService } from '../expenses/expenses.service.js';
import logger from '../../lib/logger.js';

const prisma = new PrismaClient();

export class ReportsController {
  private creditLimitReportService: CreditLimitReportService;
  private cashFlowService: CashFlowService;
  private stockReportService: StockReportService;
  private salesReportService: SalesReportService;
  private paymentReportService: PaymentReportService;
  private importReportService: ImportReportService;
  private expenseReportService: ExpenseReportService;

  constructor() {
    this.creditLimitReportService = new CreditLimitReportService(prisma);
    this.cashFlowService = new CashFlowService(prisma);
    this.stockReportService = new StockReportService(prisma);
    this.salesReportService = new SalesReportService(prisma);
    this.paymentReportService = new PaymentReportService(prisma);
    this.importReportService = new ImportReportService(prisma);
    this.expenseReportService = new ExpenseReportService(prisma);
  }

  // ---- Existing endpoints ----

  getCreditLimits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 80;
      if (threshold < 0 || threshold > 100) {
        return res.status(400).json({ success: false, message: 'Threshold must be between 0 and 100' });
      }
      const clients = await this.creditLimitReportService.getHighUtilizationClients(threshold);
      logger.info('Credit limit report generated', { threshold, clientCount: clients.length, userId: req.user?.id });
      res.json({ success: true, data: clients, threshold });
    } catch (error) { next(error); }
  };

  getCreditLimitSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.creditLimitReportService.getCreditLimitSummary();
      logger.info('Credit limit summary generated', { userId: req.user?.id });
      res.json({ success: true, data: summary });
    } catch (error) { next(error); }
  };

  getTaxSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const summary = await this.creditLimitReportService.getTaxSummary(dateFrom, dateTo);
      logger.info('Tax summary report generated', { dateFrom, dateTo, userId: req.user?.id });
      res.json({ success: true, data: summary });
    } catch (error) { next(error); }
  };

  getExpenseSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const summary = await expenseService.getExpenseSummary(dateFrom, dateTo);
      logger.info('Expense summary report generated', { dateFrom, dateTo, userId: req.user?.id });
      res.json({ success: true, data: summary });
    } catch (error) { next(error); }
  };

  getCashFlow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const report = await this.cashFlowService.getCashFlowReport(dateFrom, dateTo);
      logger.info('Cash flow report generated', { dateFrom, dateTo, netCashFlow: report.netCashFlow, userId: req.user?.id });
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  };

  // ---- Story 4.4: Stock Reports ----

  getStockReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        warehouseId: req.query.warehouseId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        status: req.query.status as 'in-stock' | 'low-stock' | 'out-of-stock' | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.stockReportService.getStockReport(filters);
      logger.info('Stock report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getStockValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.stockReportService.getStockValuation();
      logger.info('Stock valuation report generated', { userId: req.user?.id });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  // ---- Story 4.5: Sales Reports ----

  getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const filters = {
        dateFrom,
        dateTo,
        clientId: req.query.clientId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.salesReportService.getSalesReport(filters);
      logger.info('Sales report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getSalesByClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const data = await this.salesReportService.getSalesByClient(dateFrom, dateTo);
      logger.info('Sales by client report generated', { userId: req.user?.id });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  getSalesByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const data = await this.salesReportService.getSalesByProduct(dateFrom, dateTo);
      logger.info('Sales by product report generated', { userId: req.user?.id });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  // ---- Story 4.6: Payment Reports ----

  getPaymentCollections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const filters = {
        dateFrom,
        dateTo,
        clientId: req.query.clientId as string | undefined,
        method: req.query.method as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.paymentReportService.getPaymentCollectionReport(filters);
      logger.info('Payment collections report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getReceivables = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.paymentReportService.getReceivablesReport();
      logger.info('Receivables report generated', { userId: req.user?.id });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };

  // ---- Story 4.7: Import Reports ----

  getImportCostReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        supplierId: req.query.supplierId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.importReportService.getImportCostReport(filters);
      logger.info('Import cost report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  // ---- Story 4.8: Expense Reports ----

  getExpenseReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const filters = {
        dateFrom,
        dateTo,
        category: req.query.category as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.expenseReportService.getExpenseReport(filters);
      logger.info('Expense report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getExpensesTrend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.expenseReportService.getExpensesTrend();
      logger.info('Expenses trend report generated', { userId: req.user?.id });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  };
}
