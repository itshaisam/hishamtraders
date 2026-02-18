import { Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

interface CollectionMetrics {
  dateFrom: string;
  dateTo: string;
  totalInvoiced: number;
  totalCollected: number;
  collectionRate: number;
  dso: number;
  cei: number;
  totalOutstanding: number;
  overdueAmount: number;
}

interface TrendItem {
  month: string;
  totalInvoiced: number;
  totalCollected: number;
  collectionRate: number;
}

export class CollectionEfficiencyService {
  private prisma: any;

  constructor(prismaClient?: any) {
    this.prisma = prismaClient || defaultPrisma;
  }

  /**
   * Get collection efficiency metrics for a date range, optionally filtered by agent.
   */
  async getCollectionEfficiencyMetrics(
    dateFrom?: string,
    dateTo?: string,
    agentId?: string
  ): Promise<CollectionMetrics> {
    const now = new Date();
    const effectiveDateTo = dateTo ? new Date(dateTo) : now;
    const effectiveDateFrom = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    // Number of days in the period
    const periodDays = Math.max(
      1,
      Math.ceil(
        (effectiveDateTo.getTime() - effectiveDateFrom.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // ---------------------------------------------------------------
    // 1. Total Invoiced: sum of invoice.total in period (excluding VOIDED/CANCELLED)
    // ---------------------------------------------------------------
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      invoiceDate: { gte: effectiveDateFrom, lte: effectiveDateTo },
      status: { notIn: ['VOIDED', 'CANCELLED'] },
    };
    // If agentId is provided, filter invoices by clients assigned to that agent
    if (agentId) {
      invoiceWhere.client = { recoveryAgentId: agentId };
    }

    const invoiceAgg = await this.prisma.invoice.aggregate({
      where: invoiceWhere,
      _sum: { total: true },
    });
    const totalInvoiced = invoiceAgg._sum.total
      ? parseFloat(invoiceAgg._sum.total.toString())
      : 0;

    // ---------------------------------------------------------------
    // 2. Total Collected: sum of payment.amount (CLIENT type) in period
    // ---------------------------------------------------------------
    const paymentWhere: Prisma.PaymentWhereInput = {
      paymentType: 'CLIENT',
      date: { gte: effectiveDateFrom, lte: effectiveDateTo },
    };
    if (agentId) {
      paymentWhere.client = { recoveryAgentId: agentId };
    }

    const paymentAgg = await this.prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true },
    });
    const totalCollected = paymentAgg._sum.amount
      ? parseFloat(paymentAgg._sum.amount.toString())
      : 0;

    // ---------------------------------------------------------------
    // 3. Collection Rate
    // ---------------------------------------------------------------
    const collectionRate = totalInvoiced > 0
      ? Math.round((totalCollected / totalInvoiced) * 10000) / 100
      : 0;

    // ---------------------------------------------------------------
    // 4. Total Outstanding: sum of client.balance where balance > 0
    // ---------------------------------------------------------------
    const clientBalanceWhere: Prisma.ClientWhereInput = {
      balance: { gt: 0 },
    };
    if (agentId) {
      clientBalanceWhere.recoveryAgentId = agentId;
    }

    const balanceAgg = await this.prisma.client.aggregate({
      where: clientBalanceWhere,
      _sum: { balance: true },
    });
    const totalOutstanding = balanceAgg._sum.balance
      ? parseFloat(balanceAgg._sum.balance.toString())
      : 0;

    // ---------------------------------------------------------------
    // 5. DSO (Days Sales Outstanding)
    //    = (totalOutstanding / totalInvoiced) * periodDays
    //    If no invoiced amount, DSO = 0
    // ---------------------------------------------------------------
    const dso = totalInvoiced > 0
      ? Math.round((totalOutstanding / totalInvoiced) * periodDays * 10000) / 10000
      : 0;

    // ---------------------------------------------------------------
    // 6. CEI (Collection Effectiveness Index)
    //    = ((beginningReceivables + creditSales - endingReceivables)
    //       / (beginningReceivables + creditSales - currentReceivables)) * 100
    //
    //    beginningReceivables = sum of invoice outstanding at dateFrom
    //    endingReceivables = sum of invoice outstanding at dateTo
    //    creditSales = totalInvoiced in period (credit invoices)
    //    currentReceivables = sum of outstanding from invoices NOT yet due
    // ---------------------------------------------------------------
    // Simplification: beginning balance = total outstanding as of dateFrom
    //   i.e. invoices created before dateFrom with (total - paidAmount) > 0
    // ending balance = current total outstanding (from client.balance)
    // current receivables = outstanding for invoices where dueDate >= now (not yet overdue)

    // Beginning receivables: invoices created before dateFrom, not voided/cancelled
    const beginningInvoices = await this.prisma.invoice.findMany({
      where: {
        invoiceDate: { lt: effectiveDateFrom },
        status: { notIn: ['VOIDED', 'CANCELLED', 'PAID'] },
        ...(agentId ? { client: { recoveryAgentId: agentId } } : {}),
      },
      select: { total: true, paidAmount: true },
    });

    let beginningReceivables = 0;
    for (const inv of beginningInvoices) {
      const outstanding = parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString());
      if (outstanding > 0) {
        beginningReceivables += outstanding;
      }
    }

    const endingReceivables = totalOutstanding;

    // Current receivables: outstanding on invoices where dueDate >= now (not overdue)
    const currentInvoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: { gte: now },
        status: { in: ['PENDING', 'PARTIAL'] },
        ...(agentId ? { client: { recoveryAgentId: agentId } } : {}),
      },
      select: { total: true, paidAmount: true },
    });

    let currentReceivables = 0;
    for (const inv of currentInvoices) {
      const outstanding = parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString());
      if (outstanding > 0) {
        currentReceivables += outstanding;
      }
    }

    // CEI formula
    const ceiNumerator = beginningReceivables + totalInvoiced - endingReceivables;
    const ceiDenominator = beginningReceivables + totalInvoiced - currentReceivables;
    const cei = ceiDenominator > 0
      ? Math.round((ceiNumerator / ceiDenominator) * 10000) / 100
      : 0;

    // ---------------------------------------------------------------
    // 7. Overdue Amount: sum(total - paidAmount) for invoices
    //    where dueDate < now and status in PENDING/PARTIAL/OVERDUE
    // ---------------------------------------------------------------
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        ...(agentId ? { client: { recoveryAgentId: agentId } } : {}),
      },
      select: { total: true, paidAmount: true },
    });

    let overdueAmount = 0;
    for (const inv of overdueInvoices) {
      const outstanding = parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString());
      if (outstanding > 0) {
        overdueAmount += outstanding;
      }
    }

    logger.info('Collection efficiency metrics computed', {
      dateFrom: effectiveDateFrom.toISOString(),
      dateTo: effectiveDateTo.toISOString(),
      agentId: agentId || 'all',
      collectionRate,
      dso,
      cei,
    });

    return {
      dateFrom: effectiveDateFrom.toISOString().slice(0, 10),
      dateTo: effectiveDateTo.toISOString().slice(0, 10),
      totalInvoiced: Math.round(totalInvoiced * 10000) / 10000,
      totalCollected: Math.round(totalCollected * 10000) / 10000,
      collectionRate,
      dso,
      cei,
      totalOutstanding: Math.round(totalOutstanding * 10000) / 10000,
      overdueAmount: Math.round(overdueAmount * 10000) / 10000,
    };
  }

  /**
   * Get collection trend for the last N months.
   * Returns monthly totalInvoiced, totalCollected, and collectionRate.
   */
  async getTrend(months: number = 6): Promise<TrendItem[]> {
    const now = new Date();
    const results: TrendItem[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthLabel = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      // Total invoiced for the month
      const invoiceAgg = await this.prisma.invoice.aggregate({
        where: {
          invoiceDate: { gte: monthStart, lte: monthEnd },
          status: { notIn: ['VOIDED', 'CANCELLED'] },
        },
        _sum: { total: true },
      });
      const totalInvoiced = invoiceAgg._sum.total
        ? parseFloat(invoiceAgg._sum.total.toString())
        : 0;

      // Total collected for the month
      const paymentAgg = await this.prisma.payment.aggregate({
        where: {
          paymentType: 'CLIENT',
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });
      const totalCollected = paymentAgg._sum.amount
        ? parseFloat(paymentAgg._sum.amount.toString())
        : 0;

      const collectionRate = totalInvoiced > 0
        ? Math.round((totalCollected / totalInvoiced) * 10000) / 100
        : 0;

      results.push({
        month: monthLabel,
        totalInvoiced: Math.round(totalInvoiced * 10000) / 10000,
        totalCollected: Math.round(totalCollected * 10000) / 10000,
        collectionRate,
      });
    }

    logger.info('Collection trend computed', { months, dataPoints: results.length });

    return results;
  }
}
