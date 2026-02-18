import { Request, Response, NextFunction } from 'express';
import { CreditLimitReportService } from './credit-limit-report.service.js';
import { CashFlowService } from './cash-flow.service.js';
import { StockReportService } from './stock-report.service.js';
import { SalesReportService } from './sales-report.service.js';
import { PaymentReportService } from './payment-report.service.js';
import { ImportReportService } from './import-report.service.js';
import { ExpenseReportService } from './expense-report.service.js';
import { GatePassReportService } from './gate-pass-report.service.js';
import { TrialBalanceService } from './trial-balance.service.js';
import { BalanceSheetService } from './balance-sheet.service.js';
import { GeneralLedgerService } from './general-ledger.service.js';
import { AgingAnalysisService } from './aging-analysis.service.js';
import { AgentPerformanceService } from './agent-performance.service.js';
import { CollectionEfficiencyService } from './collection-efficiency.service.js';
import { RecoveryReportsService } from './recovery-reports.service.js';
import { expenseService } from '../expenses/expenses.service.js';
import { generateExcel } from '../../utils/excel-export.util.js';
import { BadRequestError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';

const MAX_EXPORT_ROWS = 10000;

export class ReportsController {
  private creditLimitReportService: CreditLimitReportService;
  private cashFlowService: CashFlowService;
  private stockReportService: StockReportService;
  private salesReportService: SalesReportService;
  private paymentReportService: PaymentReportService;
  private importReportService: ImportReportService;
  private expenseReportService: ExpenseReportService;
  private trialBalanceService: TrialBalanceService;
  private balanceSheetService: BalanceSheetService;
  private generalLedgerService: GeneralLedgerService;
  private gatePassReportService: GatePassReportService;
  private agingAnalysisService: AgingAnalysisService;
  private agentPerformanceService: AgentPerformanceService;
  private collectionEfficiencyService: CollectionEfficiencyService;
  private recoveryReportsService: RecoveryReportsService;

  constructor() {
    this.creditLimitReportService = new CreditLimitReportService(prisma);
    this.cashFlowService = new CashFlowService(prisma);
    this.stockReportService = new StockReportService(prisma);
    this.salesReportService = new SalesReportService(prisma);
    this.paymentReportService = new PaymentReportService(prisma);
    this.importReportService = new ImportReportService(prisma);
    this.expenseReportService = new ExpenseReportService(prisma);
    this.trialBalanceService = new TrialBalanceService();
    this.balanceSheetService = new BalanceSheetService();
    this.generalLedgerService = new GeneralLedgerService();
    this.gatePassReportService = new GatePassReportService(prisma);
    this.agingAnalysisService = new AgingAnalysisService(prisma);
    this.agentPerformanceService = new AgentPerformanceService(prisma);
    this.collectionEfficiencyService = new CollectionEfficiencyService(prisma);
    this.recoveryReportsService = new RecoveryReportsService(prisma);
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

  // ════════════════════════════════════════════════════════════════════
  // Story 5.4: Trial Balance
  // ════════════════════════════════════════════════════════════════════

  getTrialBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asOfDate = req.query.asOfDate
        ? new Date(req.query.asOfDate as string)
        : new Date();
      const report = await this.trialBalanceService.getTrialBalance(asOfDate);
      logger.info('Trial balance generated', { asOfDate: report.asOfDate, userId: req.user?.id });
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 5.5: Balance Sheet
  // ════════════════════════════════════════════════════════════════════

  getBalanceSheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asOfDate = req.query.asOfDate
        ? new Date(req.query.asOfDate as string)
        : new Date();
      const report = await this.balanceSheetService.getBalanceSheet(asOfDate);
      logger.info('Balance sheet generated', { asOfDate: report.asOfDate, userId: req.user?.id });
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 5.6: General Ledger
  // ════════════════════════════════════════════════════════════════════

  getGeneralLedger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountHeadId = req.query.accountHeadId as string;
      if (!accountHeadId) {
        throw new BadRequestError('accountHeadId is required');
      }
      const dateFrom = req.query.dateFrom
        ? new Date(req.query.dateFrom as string)
        : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo
        ? new Date(req.query.dateTo as string)
        : new Date();
      const report = await this.generalLedgerService.getGeneralLedger(accountHeadId, dateFrom, dateTo);
      logger.info('General ledger generated', { accountHeadId, userId: req.user?.id });
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 6.10: Gate Pass Reports
  // ════════════════════════════════════════════════════════════════════

  getGatePassActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { warehouseId, status, purpose, dateFrom, dateTo, page, limit } = req.query;
      const result = await this.gatePassReportService.getActivityReport({
        warehouseId: warehouseId as string,
        status: status as string,
        purpose: purpose as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      logger.info('Gate pass activity report generated', { userId: (req as any).user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getGatePassSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { warehouseId, dateFrom, dateTo } = req.query;
      const result = await this.gatePassReportService.getSummary({
        warehouseId: warehouseId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });
      logger.info('Gate pass summary report generated', { userId: (req as any).user?.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 7.3: Aging Analysis
  // ════════════════════════════════════════════════════════════════════

  getAgingAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        agentId: req.query.agentId as string | undefined,
        city: req.query.city as string | undefined,
        minBalance: req.query.minBalance ? parseFloat(req.query.minBalance as string) : undefined,
      };
      const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;
      const result = await this.agingAnalysisService.getAgingAnalysis(filters, asOfDate);
      logger.info('Aging analysis generated', { userId: req.user?.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  exportAgingAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        agentId: req.query.agentId as string | undefined,
        city: req.query.city as string | undefined,
        minBalance: req.query.minBalance ? parseFloat(req.query.minBalance as string) : undefined,
      };
      const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;
      const buffer = await this.agingAnalysisService.exportAgingAnalysisExcel(
        filters,
        asOfDate,
        req.user?.email || 'System'
      );
      logger.info('Aging analysis exported', { userId: req.user?.id });
      this.sendExcel(res, buffer, 'aging-analysis');
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 7.8: Collection Efficiency
  // ════════════════════════════════════════════════════════════════════

  getCollectionEfficiency = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dateFrom, dateTo, agentId } = req.query;
      const result = await this.collectionEfficiencyService.getCollectionEfficiencyMetrics(
        dateFrom as string | undefined,
        dateTo as string | undefined,
        agentId as string | undefined
      );
      logger.info('Collection efficiency report generated', { userId: req.user?.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  getCollectionEfficiencyTrend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 6;
      const result = await this.collectionEfficiencyService.getTrend(months);
      logger.info('Collection efficiency trend generated', { userId: req.user?.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 7.9: Recovery Reports
  // ════════════════════════════════════════════════════════════════════

  getVisitActivityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        agentId: req.query.agentId as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        outcome: req.query.outcome as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.recoveryReportsService.visitActivityReport(filters);
      logger.info('Visit activity report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getCollectionSummaryReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        agentId: req.query.agentId as string | undefined,
      };
      const result = await this.recoveryReportsService.collectionSummaryReport(filters);
      logger.info('Collection summary report generated', { userId: req.user?.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  getOverdueClientsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        minDaysOverdue: req.query.minDaysOverdue ? parseInt(req.query.minDaysOverdue as string) : undefined,
        city: req.query.city as string | undefined,
        agentId: req.query.agentId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const result = await this.recoveryReportsService.overdueClientsReport(filters);
      logger.info('Overdue clients report generated', { userId: req.user?.id });
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  };

  getAgentProductivityReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
      };
      const result = await this.recoveryReportsService.agentProductivityReport(filters);
      logger.info('Agent productivity report generated', { userId: req.user?.id });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  };

  // ════════════════════════════════════════════════════════════════════
  // Story 4.9: Excel Export Handlers
  // ════════════════════════════════════════════════════════════════════

  private sendExcel(res: Response, buffer: Buffer, filename: string) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  }

  exportStockReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        warehouseId: req.query.warehouseId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        status: req.query.status as 'in-stock' | 'low-stock' | 'out-of-stock' | undefined,
        page: 1,
        limit: MAX_EXPORT_ROWS,
      };
      const result = await this.stockReportService.getStockReport(filters);

      if (result.meta.total > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const buffer = await generateExcel({
        title: 'Stock Report',
        filters: {
          Warehouse: filters.warehouseId || 'All',
          Category: filters.categoryId || 'All',
          Status: filters.status || 'All',
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'SKU', key: 'sku', width: 14 },
          { header: 'Product', key: 'productName', width: 28 },
          { header: 'Category', key: 'categoryName', width: 16 },
          { header: 'Warehouse', key: 'warehouseName', width: 16 },
          { header: 'Quantity', key: 'quantity', width: 10 },
          { header: 'Reorder Level', key: 'reorderLevel', width: 13 },
          { header: 'Cost Price', key: 'costPrice', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Stock Value', key: 'value', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Status', key: 'status', width: 12 },
        ],
        data: result.data,
        summaryRow: { sku: 'TOTAL', value: result.summary.totalValue, quantity: result.summary.totalItems },
      });

      logger.info('Stock report exported', { userId: req.user?.id, rows: result.data.length });
      this.sendExcel(res, buffer, 'stock-report');
    } catch (error) { next(error); }
  };

  exportStockValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.stockReportService.getStockValuation();

      const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
      const totalQty = data.reduce((s, d) => s + d.totalQuantity, 0);

      const buffer = await generateExcel({
        title: 'Stock Valuation Report',
        filters: {},
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Category', key: 'categoryName', width: 22 },
          { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
          { header: 'Total Value', key: 'totalValue', width: 18, numFmt: '"Rs."#,##0.00' },
          { header: '% of Total', key: 'percentage', width: 12, numFmt: '0.00"%"' },
        ],
        data,
        summaryRow: { categoryName: 'TOTAL', totalQuantity: totalQty, totalValue: Math.round(totalValue * 10000) / 10000 },
      });

      logger.info('Stock valuation exported', { userId: req.user?.id });
      this.sendExcel(res, buffer, 'stock-valuation');
    } catch (error) { next(error); }
  };

  exportSalesReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const filters = {
        dateFrom,
        dateTo,
        clientId: req.query.clientId as string | undefined,
        status: req.query.status as string | undefined,
        page: 1,
        limit: MAX_EXPORT_ROWS,
      };
      const result = await this.salesReportService.getSalesReport(filters);

      if (result.meta.total > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const buffer = await generateExcel({
        title: 'Sales Report',
        filters: {
          'Date From': dateFrom.toISOString().slice(0, 10),
          'Date To': dateTo.toISOString().slice(0, 10),
          Status: filters.status || 'All',
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Invoice #', key: 'invoiceNumber', width: 14 },
          { header: 'Date', key: 'invoiceDate', width: 12 },
          { header: 'Client', key: 'clientName', width: 22 },
          { header: 'Subtotal', key: 'subtotal', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Tax', key: 'taxAmount', width: 12, numFmt: '"Rs."#,##0.00' },
          { header: 'Total', key: 'total', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Paid', key: 'paidAmount', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Outstanding', key: 'outstanding', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Status', key: 'status', width: 12 },
        ],
        data: result.data,
        summaryRow: {
          invoiceNumber: 'TOTAL',
          total: result.summary.totalAmount,
          paidAmount: result.summary.totalPaid,
          outstanding: result.summary.totalOutstanding,
        },
      });

      logger.info('Sales report exported', { userId: req.user?.id, rows: result.data.length });
      this.sendExcel(res, buffer, 'sales-report');
    } catch (error) { next(error); }
  };

  exportSalesByClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const data = await this.salesReportService.getSalesByClient(dateFrom, dateTo);

      if (data.length > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
      const totalInvoices = data.reduce((s, d) => s + d.invoiceCount, 0);

      const buffer = await generateExcel({
        title: 'Sales by Client',
        filters: {
          'Date From': dateFrom.toISOString().slice(0, 10),
          'Date To': dateTo.toISOString().slice(0, 10),
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Client', key: 'clientName', width: 28 },
          { header: 'Invoices', key: 'invoiceCount', width: 12 },
          { header: 'Revenue', key: 'revenue', width: 18, numFmt: '"Rs."#,##0.00' },
        ],
        data,
        summaryRow: { clientName: 'TOTAL', invoiceCount: totalInvoices, revenue: Math.round(totalRevenue * 10000) / 10000 },
      });

      logger.info('Sales by client exported', { userId: req.user?.id });
      this.sendExcel(res, buffer, 'sales-by-client');
    } catch (error) { next(error); }
  };

  exportSalesByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const data = await this.salesReportService.getSalesByProduct(dateFrom, dateTo);

      if (data.length > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const totalQty = data.reduce((s, d) => s + d.qtySold, 0);
      const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

      const buffer = await generateExcel({
        title: 'Sales by Product',
        filters: {
          'Date From': dateFrom.toISOString().slice(0, 10),
          'Date To': dateTo.toISOString().slice(0, 10),
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Product', key: 'productName', width: 28 },
          { header: 'SKU', key: 'sku', width: 14 },
          { header: 'Qty Sold', key: 'qtySold', width: 12 },
          { header: 'Revenue', key: 'revenue', width: 18, numFmt: '"Rs."#,##0.00' },
        ],
        data,
        summaryRow: { productName: 'TOTAL', qtySold: totalQty, revenue: Math.round(totalRevenue * 10000) / 10000 },
      });

      logger.info('Sales by product exported', { userId: req.user?.id });
      this.sendExcel(res, buffer, 'sales-by-product');
    } catch (error) { next(error); }
  };

  exportPaymentCollections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const filters = {
        dateFrom,
        dateTo,
        clientId: req.query.clientId as string | undefined,
        method: req.query.method as string | undefined,
        page: 1,
        limit: MAX_EXPORT_ROWS,
      };
      const result = await this.paymentReportService.getPaymentCollectionReport(filters);

      if (result.meta.total > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const buffer = await generateExcel({
        title: 'Payment Collection Report',
        filters: {
          'Date From': dateFrom.toISOString().slice(0, 10),
          'Date To': dateTo.toISOString().slice(0, 10),
          Method: filters.method || 'All',
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Client', key: 'clientName', width: 24 },
          { header: 'Amount', key: 'amount', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Method', key: 'method', width: 16 },
          { header: 'Reference #', key: 'referenceNumber', width: 16 },
          { header: 'Notes', key: 'notes', width: 24 },
        ],
        data: result.data,
        summaryRow: { date: 'TOTAL', amount: result.summary.totalCollected },
      });

      logger.info('Payment collections exported', { userId: req.user?.id, rows: result.data.length });
      this.sendExcel(res, buffer, 'payment-collections');
    } catch (error) { next(error); }
  };

  exportReceivables = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.paymentReportService.getReceivablesReport();

      const totalBalance = data.reduce((s: number, d: any) => s + d.balance, 0);
      const totalOverdue = data.reduce((s: number, d: any) => s + d.overdueAmount, 0);

      const buffer = await generateExcel({
        title: 'Outstanding Receivables',
        filters: {},
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Client', key: 'clientName', width: 24 },
          { header: 'Balance', key: 'balance', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Credit Limit', key: 'creditLimit', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Overdue Amount', key: 'overdueAmount', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Days Past Due', key: 'daysPastDue', width: 14 },
        ],
        data,
        summaryRow: {
          clientName: 'TOTAL',
          balance: Math.round(totalBalance * 10000) / 10000,
          overdueAmount: Math.round(totalOverdue * 10000) / 10000,
        },
      });

      logger.info('Receivables exported', { userId: req.user?.id });
      this.sendExcel(res, buffer, 'outstanding-receivables');
    } catch (error) { next(error); }
  };

  exportImportCostReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        supplierId: req.query.supplierId as string | undefined,
        status: req.query.status as string | undefined,
        page: 1,
        limit: MAX_EXPORT_ROWS,
      };
      const result = await this.importReportService.getImportCostReport(filters);

      if (result.meta.total > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const buffer = await generateExcel({
        title: 'Import Cost Report',
        filters: {
          'Date From': filters.dateFrom?.toISOString().slice(0, 10) || 'All',
          'Date To': filters.dateTo?.toISOString().slice(0, 10) || 'All',
          Status: filters.status || 'All',
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'PO #', key: 'poNumber', width: 14 },
          { header: 'Date', key: 'orderDate', width: 12 },
          { header: 'Supplier', key: 'supplierName', width: 22 },
          { header: 'Product Cost', key: 'productCost', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Shipping', key: 'shipping', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Customs', key: 'customs', width: 14, numFmt: '"Rs."#,##0.00' },
          { header: 'Tax', key: 'tax', width: 12, numFmt: '"Rs."#,##0.00' },
          { header: 'Other', key: 'other', width: 12, numFmt: '"Rs."#,##0.00' },
          { header: 'Total Landed', key: 'totalLanded', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Status', key: 'status', width: 12 },
        ],
        data: result.data,
        summaryRow: {
          poNumber: 'TOTAL',
          productCost: result.summary.totalProductCost,
          shipping: result.summary.totalShipping,
          customs: result.summary.totalCustoms,
          tax: result.summary.totalTax,
          other: result.summary.totalOther,
          totalLanded: result.summary.totalLanded,
        },
      });

      logger.info('Import cost report exported', { userId: req.user?.id, rows: result.data.length });
      this.sendExcel(res, buffer, 'import-cost-report');
    } catch (error) { next(error); }
  };

  exportExpenseReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const filters = {
        dateFrom,
        dateTo,
        category: req.query.category as string | undefined,
        page: 1,
        limit: MAX_EXPORT_ROWS,
      };
      const result = await this.expenseReportService.getExpenseReport(filters);

      if (result.meta.total > MAX_EXPORT_ROWS) {
        throw new BadRequestError(`Export limited to ${MAX_EXPORT_ROWS} rows. Please narrow your filters.`);
      }

      const buffer = await generateExcel({
        title: 'Expense Report',
        filters: {
          'Date From': dateFrom.toISOString().slice(0, 10),
          'Date To': dateTo.toISOString().slice(0, 10),
          Category: filters.category || 'All',
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Category', key: 'category', width: 16 },
          { header: 'Description', key: 'description', width: 30 },
          { header: 'Amount', key: 'amount', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Payment Method', key: 'paymentMethod', width: 16 },
          { header: 'Recorded By', key: 'recordedBy', width: 16 },
        ],
        data: result.data,
        summaryRow: { date: 'TOTAL', amount: result.summary.totalExpenses },
      });

      logger.info('Expense report exported', { userId: req.user?.id, rows: result.data.length });
      this.sendExcel(res, buffer, 'expense-report');
    } catch (error) { next(error); }
  };

  exportExpensesByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(new Date().getFullYear(), 0, 1);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const summary = await expenseService.getExpenseSummary(dateFrom, dateTo);

      const data = summary.byCategory.map((c: any) => ({
        category: c.category,
        total: c.total,
        count: c.count,
        percentage: summary.totalExpenses > 0
          ? Math.round((c.total / summary.totalExpenses) * 10000) / 100
          : 0,
      }));

      const buffer = await generateExcel({
        title: 'Expenses by Category',
        filters: {
          'Date From': dateFrom.toISOString().slice(0, 10),
          'Date To': dateTo.toISOString().slice(0, 10),
        },
        generatedBy: req.user?.email || 'System',
        columns: [
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Total', key: 'total', width: 16, numFmt: '"Rs."#,##0.00' },
          { header: 'Count', key: 'count', width: 10 },
          { header: '% of Total', key: 'percentage', width: 12, numFmt: '0.00"%"' },
        ],
        data,
        summaryRow: {
          category: 'TOTAL',
          total: summary.totalExpenses,
          count: data.reduce((s: number, d: any) => s + d.count, 0),
        },
      });

      logger.info('Expenses by category exported', { userId: req.user?.id });
      this.sendExcel(res, buffer, 'expenses-by-category');
    } catch (error) { next(error); }
  };
}
