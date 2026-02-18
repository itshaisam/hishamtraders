import { prisma as defaultPrisma } from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import { generateExcel } from '../../utils/excel-export.util.js';

interface AgingFilters {
  agentId?: string;
  city?: string;
  minBalance?: number;
}

interface AgingRow {
  clientId: string;
  clientName: string;
  city: string | null;
  area: string | null;
  balance: number;
  creditLimit: number;
  recoveryAgent: string | null;
  current: number;
  days1to7: number;
  days8to14: number;
  days15to30: number;
  days30plus: number;
  totalOverdue: number;
  oldestDueDate: Date | null;
}

interface AgingSummary {
  totalOutstanding: number;
  currentTotal: number;
  days1to7Total: number;
  days8to14Total: number;
  days15to30Total: number;
  days30plusTotal: number;
  clientCount: number;
}

interface AgingAnalysisResult {
  clients: AgingRow[];
  summary: AgingSummary;
}

export class AgingAnalysisService {
  private prisma: any;

  constructor(prismaClient?: any) {
    this.prisma = prismaClient ?? defaultPrisma;
  }

  /**
   * Get aging analysis for all active clients with outstanding balances.
   * Buckets invoices by how many days past due they are relative to asOfDate.
   */
  async getAgingAnalysis(
    filters: AgingFilters = {},
    asOfDate?: Date
  ): Promise<AgingAnalysisResult> {
    const referenceDate = asOfDate ?? new Date();

    // Build where clause for clients
    const clientWhere: any = {
      status: 'ACTIVE',
      balance: { gt: 0 },
    };

    if (filters.agentId) {
      clientWhere.recoveryAgentId = filters.agentId;
    }
    if (filters.city) {
      clientWhere.city = filters.city;
    }
    if (filters.minBalance !== undefined && filters.minBalance !== null) {
      clientWhere.balance = { gte: filters.minBalance };
    }

    // Fetch clients with their unpaid invoices and recovery agent info
    const clients = await this.prisma.client.findMany({
      where: clientWhere,
      include: {
        invoices: {
          where: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
          select: {
            total: true,
            paidAmount: true,
            dueDate: true,
          },
        },
        recoveryAgent: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { balance: 'desc' },
    });

    logger.debug(`Aging analysis: found ${clients.length} clients with outstanding balance`);

    const agingRows: AgingRow[] = [];

    for (const client of clients) {
      let current = 0;
      let days1to7 = 0;
      let days8to14 = 0;
      let days15to30 = 0;
      let days30plus = 0;
      let oldestDueDate: Date | null = null;

      for (const invoice of client.invoices) {
        const outstanding = parseFloat(invoice.total.toString()) - parseFloat(invoice.paidAmount.toString());
        if (outstanding <= 0) continue;

        const dueDate = new Date(invoice.dueDate);
        const diffMs = referenceDate.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Track oldest due date
        if (oldestDueDate === null || dueDate < oldestDueDate) {
          oldestDueDate = dueDate;
        }

        if (diffDays <= 0) {
          // Not yet due
          current += outstanding;
        } else if (diffDays >= 1 && diffDays <= 7) {
          days1to7 += outstanding;
        } else if (diffDays >= 8 && diffDays <= 14) {
          days8to14 += outstanding;
        } else if (diffDays >= 15 && diffDays <= 30) {
          days15to30 += outstanding;
        } else {
          // 31+ days overdue
          days30plus += outstanding;
        }
      }

      const totalOverdue = days1to7 + days8to14 + days15to30 + days30plus;

      agingRows.push({
        clientId: client.id,
        clientName: client.name,
        city: client.city,
        area: client.area,
        balance: parseFloat(client.balance.toString()),
        creditLimit: parseFloat(client.creditLimit.toString()),
        recoveryAgent: client.recoveryAgent?.name ?? null,
        current: Math.round(current * 10000) / 10000,
        days1to7: Math.round(days1to7 * 10000) / 10000,
        days8to14: Math.round(days8to14 * 10000) / 10000,
        days15to30: Math.round(days15to30 * 10000) / 10000,
        days30plus: Math.round(days30plus * 10000) / 10000,
        totalOverdue: Math.round(totalOverdue * 10000) / 10000,
        oldestDueDate,
      });
    }

    // Compute summary totals
    const summary: AgingSummary = {
      totalOutstanding: 0,
      currentTotal: 0,
      days1to7Total: 0,
      days8to14Total: 0,
      days15to30Total: 0,
      days30plusTotal: 0,
      clientCount: agingRows.length,
    };

    for (const row of agingRows) {
      summary.currentTotal += row.current;
      summary.days1to7Total += row.days1to7;
      summary.days8to14Total += row.days8to14;
      summary.days15to30Total += row.days15to30;
      summary.days30plusTotal += row.days30plus;
      summary.totalOutstanding += row.current + row.totalOverdue;
    }

    summary.totalOutstanding = Math.round(summary.totalOutstanding * 10000) / 10000;
    summary.currentTotal = Math.round(summary.currentTotal * 10000) / 10000;
    summary.days1to7Total = Math.round(summary.days1to7Total * 10000) / 10000;
    summary.days8to14Total = Math.round(summary.days8to14Total * 10000) / 10000;
    summary.days15to30Total = Math.round(summary.days15to30Total * 10000) / 10000;
    summary.days30plusTotal = Math.round(summary.days30plusTotal * 10000) / 10000;

    return { clients: agingRows, summary };
  }

  /**
   * Export the aging analysis as an Excel file.
   */
  async exportAgingAnalysisExcel(
    filters: AgingFilters = {},
    asOfDate?: Date,
    generatedBy: string = 'System'
  ): Promise<Buffer> {
    const { clients, summary } = await this.getAgingAnalysis(filters, asOfDate);

    const columns = [
      { header: 'Client', key: 'clientName', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Area', key: 'area', width: 15 },
      { header: 'Recovery Agent', key: 'recoveryAgent', width: 20 },
      { header: 'Balance', key: 'balance', width: 15, numFmt: '"Rs."#,##0.00' },
      { header: 'Current', key: 'current', width: 15, numFmt: '"Rs."#,##0.00' },
      { header: '1-7 Days', key: 'days1to7', width: 14, numFmt: '"Rs."#,##0.00' },
      { header: '8-14 Days', key: 'days8to14', width: 14, numFmt: '"Rs."#,##0.00' },
      { header: '15-30 Days', key: 'days15to30', width: 14, numFmt: '"Rs."#,##0.00' },
      { header: '30+ Days', key: 'days30plus', width: 14, numFmt: '"Rs."#,##0.00' },
      { header: 'Total Overdue', key: 'totalOverdue', width: 16, numFmt: '"Rs."#,##0.00' },
    ];

    const data = clients.map((row) => ({
      clientName: row.clientName,
      city: row.city ?? '',
      area: row.area ?? '',
      recoveryAgent: row.recoveryAgent ?? '',
      balance: row.balance,
      current: row.current,
      days1to7: row.days1to7,
      days8to14: row.days8to14,
      days15to30: row.days15to30,
      days30plus: row.days30plus,
      totalOverdue: row.totalOverdue,
    }));

    const filterLabels: Record<string, string> = {};
    if (filters.agentId) filterLabels['Recovery Agent ID'] = filters.agentId;
    if (filters.city) filterLabels['City'] = filters.city;
    if (filters.minBalance) filterLabels['Min Balance'] = filters.minBalance.toString();
    const refDate = asOfDate ?? new Date();
    filterLabels['As of Date'] = refDate.toLocaleDateString('en-PK', { dateStyle: 'medium' });

    const summaryRow: Record<string, any> = {
      clientName: `Total (${summary.clientCount} clients)`,
      city: '',
      area: '',
      recoveryAgent: '',
      balance: summary.totalOutstanding,
      current: summary.currentTotal,
      days1to7: summary.days1to7Total,
      days8to14: summary.days8to14Total,
      days15to30: summary.days15to30Total,
      days30plus: summary.days30plusTotal,
      totalOverdue:
        summary.days1to7Total +
        summary.days8to14Total +
        summary.days15to30Total +
        summary.days30plusTotal,
    };

    const buffer = await generateExcel({
      title: 'Aging Analysis Report',
      filters: filterLabels,
      generatedBy,
      columns,
      data,
      summaryRow,
    });

    logger.info(`Aging analysis Excel exported: ${clients.length} clients, generated by ${generatedBy}`);

    return buffer;
  }
}
