import { prisma } from '../lib/prisma.js';

export class DashboardService {
  async getAdminStats() {
    const [totalUsers, auditLogCount, dbConnected] = await Promise.all([
      prisma.user.count(),
      prisma.auditLog.count(),
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    ]);

    return {
      totalUsers,
      auditLogCount,
      dbConnected,
    };
  }

  async getWarehouseStats() {
    // For MVP, return mock data since we don't have products table yet
    return {
      pendingReceipts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      lowStockProducts: [],
    };
  }

  async getSalesStats() {
    // For MVP, return mock data since we don't have invoices table yet
    return {
      todaysSalesTotal: 0,
      todaysSalesCount: 0,
      creditLimitAlerts: 0,
      recentInvoicesCount: 0,
      recentInvoices: [],
    };
  }

  async getAccountantStats() {
    // For MVP, return mock data since we don't have transactions table yet
    return {
      cashInflow: 0,
      cashOutflow: 0,
      totalReceivables: 0,
      totalPayables: 0,
      pendingPayments: 0,
    };
  }

  async getRecoveryStats() {
    // For MVP, return mock data since we don't have clients/payments table yet
    return {
      totalOutstanding: 0,
      overdueClients: 0,
      collectedThisWeek: 0,
      overdueClientsList: [],
    };
  }
}
