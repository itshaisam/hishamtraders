import { CreditLimitService } from '../clients/credit-limit.service.js';

export class CreditLimitReportService {
  private creditLimitService: CreditLimitService;

  constructor(private prisma: any) {
    this.creditLimitService = new CreditLimitService(prisma);
  }

  /**
   * Get clients with high credit utilization
   * @param threshold - Utilization percentage threshold (default 80%)
   * @returns List of clients exceeding threshold, sorted by utilization
   */
  async getHighUtilizationClients(threshold: number = 80) {
    return this.creditLimitService.getClientsOverThreshold(threshold);
  }

  /**
   * Get credit limit summary statistics
   */
  async getCreditLimitSummary() {
    const clients = await this.prisma.client.findMany({
      where: {
        status: 'ACTIVE',
        creditLimit: {
          gt: 0,
        },
      },
      select: {
        balance: true,
        creditLimit: true,
      },
    });

    const clientsWithUtilization = clients.map((client: any) => {
      const balance = parseFloat(client.balance.toString());
      const limit = parseFloat(client.creditLimit.toString());
      const utilization = limit > 0 ? (balance / limit) * 100 : 0;
      return { balance, limit, utilization };
    });

    const exceeded = clientsWithUtilization.filter((c: any) => c.utilization > 100).length;
    const warning = clientsWithUtilization.filter((c: any) => c.utilization >= 80 && c.utilization <= 100)
      .length;
    const healthy = clientsWithUtilization.filter((c: any) => c.utilization < 80).length;

    const totalBalance = clientsWithUtilization.reduce((sum: number, c: any) => sum + c.balance, 0);
    const totalLimit = clientsWithUtilization.reduce((sum: number, c: any) => sum + c.limit, 0);
    const averageUtilization =
      totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

    return {
      totalClients: clients.length,
      exceeded,
      warning,
      healthy,
      totalBalance,
      totalLimit,
      averageUtilization,
    };
  }

  /**
   * Get tax summary for a date range (Story 3.5)
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @returns Tax summary with breakdown by rate
   */
  async getTaxSummary(dateFrom: Date, dateTo: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
      select: {
        taxAmount: true,
        taxRate: true,
      },
    });

    // Group by tax rate
    const groupedByRate = invoices.reduce((acc: any, invoice: any) => {
      const rate = parseFloat(invoice.taxRate.toString());
      const tax = parseFloat(invoice.taxAmount.toString());

      if (!acc[rate]) {
        acc[rate] = { taxRate: rate, taxAmount: 0, invoiceCount: 0 };
      }

      acc[rate].taxAmount += tax;
      acc[rate].invoiceCount += 1;

      return acc;
    }, {} as Record<number, { taxRate: number; taxAmount: number; invoiceCount: number }>);

    const byTaxRate = Object.values(groupedByRate);
    const totalTaxCollected = byTaxRate.reduce((sum: number, item: any) => sum + item.taxAmount, 0);

    return {
      totalTaxCollected,
      byTaxRate,
      dateFrom,
      dateTo,
    };
  }
}
