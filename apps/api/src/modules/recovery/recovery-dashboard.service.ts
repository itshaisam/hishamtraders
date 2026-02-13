import { Prisma, RecoveryDay } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

// ============================================================================
// Helper: Map JS day-of-week (0=Sun..6=Sat) to RecoveryDay enum
// ============================================================================

const DAY_INDEX_TO_RECOVERY_DAY: Record<number, RecoveryDay> = {
  0: 'NONE',      // Sunday -- not a recovery day
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

// ============================================================================
// RecoveryDashboardService
// ============================================================================

export class RecoveryDashboardService {

  /**
   * Aggregate multiple data points for the recovery dashboard page.
   * If role is RECOVERY_AGENT, scope data to that agent's clients.
   * If ADMIN or ACCOUNTANT, show all data.
   */
  async getRecoveryDashboard(userId: string, role: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    // Monday-based start of week: subtract (dayOfWeek + 6) % 7 days
    const dayOfWeek = now.getDay(); // 0=Sun
    const daysToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(startOfToday.getTime() - daysToMonday * 24 * 60 * 60 * 1000);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Agent filter: scope to the agent's clients if RECOVERY_AGENT
    const agentFilter: Prisma.ClientWhereInput =
      role === 'RECOVERY_AGENT' ? { recoveryAgentId: userId } : {};

    const [
      todaySchedule,
      duePromises,
      collectionMetrics,
      overdueSummary,
      recentVisits,
      alertCount,
      fulfillmentRate,
      topOverdueClients,
    ] = await Promise.all([
      this.getTodaySchedule(startOfToday, endOfToday, agentFilter, userId, role),
      this.getDuePromises(startOfToday, endOfToday, agentFilter),
      this.getCollectionMetrics(startOfToday, endOfToday, startOfWeek, startOfMonth, userId, role),
      this.getOverdueSummary(startOfToday, agentFilter),
      this.getRecentVisits(userId, role),
      this.getAlertCount(userId, role),
      this.getFulfillmentRate(userId, role),
      this.getTopOverdueClients(agentFilter),
    ]);

    return {
      todaySchedule,
      duePromises,
      collectionMetrics,
      overdueSummary,
      recentVisits,
      alertCount,
      fulfillmentRate,
      topOverdueClients,
    };
  }

  // --------------------------------------------------------------------------
  // (a) Today's Schedule
  // --------------------------------------------------------------------------

  private async getTodaySchedule(
    startOfToday: Date,
    endOfToday: Date,
    agentFilter: Prisma.ClientWhereInput,
    userId: string,
    role: string
  ) {
    const todayDay = DAY_INDEX_TO_RECOVERY_DAY[new Date().getDay()] || 'NONE';

    // Count clients scheduled for today
    const scheduledClients = await prisma.client.count({
      where: {
        recoveryDay: todayDay,
        status: 'ACTIVE',
        ...agentFilter,
      },
    });

    // Count visits completed today
    const visitFilter: Prisma.RecoveryVisitWhereInput = {
      visitDate: { gte: startOfToday, lt: endOfToday },
    };
    if (role === 'RECOVERY_AGENT') {
      visitFilter.visitedBy = userId;
    }

    const completedVisits = await prisma.recoveryVisit.count({
      where: visitFilter,
    });

    return {
      todayDay,
      scheduledClients,
      completedVisits,
    };
  }

  // --------------------------------------------------------------------------
  // (b) Due Promises
  // --------------------------------------------------------------------------

  private async getDuePromises(
    startOfToday: Date,
    endOfToday: Date,
    agentFilter: Prisma.ClientWhereInput
  ) {
    // Promises due today or overdue: promiseDate <= end of today, status = PENDING
    const clientFilterClause: Prisma.PaymentPromiseWhereInput =
      Object.keys(agentFilter).length > 0 ? { client: agentFilter } : {};

    const duePromises = await prisma.paymentPromise.findMany({
      where: {
        promiseDate: { lt: endOfToday },
        status: 'PENDING',
        ...clientFilterClause,
      },
      select: {
        promiseAmount: true,
      },
    });

    const count = duePromises.length;
    const totalAmount = duePromises.reduce(
      (sum, p) => sum + Number(p.promiseAmount),
      0
    );

    return {
      count,
      totalAmount,
    };
  }

  // --------------------------------------------------------------------------
  // (c) Collection Metrics
  // --------------------------------------------------------------------------

  private async getCollectionMetrics(
    startOfToday: Date,
    endOfToday: Date,
    startOfWeek: Date,
    startOfMonth: Date,
    userId: string,
    role: string
  ) {
    const agentVisitFilter: Prisma.RecoveryVisitWhereInput =
      role === 'RECOVERY_AGENT' ? { visitedBy: userId } : {};

    const [todayAgg, weekAgg, monthAgg] = await Promise.all([
      prisma.recoveryVisit.aggregate({
        _sum: { amountCollected: true },
        where: {
          visitDate: { gte: startOfToday, lt: endOfToday },
          ...agentVisitFilter,
        },
      }),
      prisma.recoveryVisit.aggregate({
        _sum: { amountCollected: true },
        where: {
          visitDate: { gte: startOfWeek, lt: endOfToday },
          ...agentVisitFilter,
        },
      }),
      prisma.recoveryVisit.aggregate({
        _sum: { amountCollected: true },
        where: {
          visitDate: { gte: startOfMonth, lt: endOfToday },
          ...agentVisitFilter,
        },
      }),
    ]);

    return {
      todayCollected: Number(todayAgg._sum.amountCollected || 0),
      weekCollected: Number(weekAgg._sum.amountCollected || 0),
      monthCollected: Number(monthAgg._sum.amountCollected || 0),
    };
  }

  // --------------------------------------------------------------------------
  // (d) Overdue Summary
  // --------------------------------------------------------------------------

  private async getOverdueSummary(
    startOfToday: Date,
    agentFilter: Prisma.ClientWhereInput
  ) {
    // Get clients with balance > 0 that have unpaid invoices past due
    const clients = await prisma.client.findMany({
      where: {
        balance: { gt: 0 },
        status: 'ACTIVE',
        invoices: {
          some: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            dueDate: { lt: startOfToday },
          },
        },
        ...agentFilter,
      },
      select: {
        id: true,
        balance: true,
        invoices: {
          where: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            dueDate: { lt: startOfToday },
          },
          select: {
            dueDate: true,
            total: true,
            paidAmount: true,
          },
        },
      },
    });

    // Buckets
    const buckets = {
      '1-7': { clientIds: new Set<string>(), amount: 0 },
      '8-14': { clientIds: new Set<string>(), amount: 0 },
      '15-30': { clientIds: new Set<string>(), amount: 0 },
      '30+': { clientIds: new Set<string>(), amount: 0 },
    };

    for (const client of clients) {
      for (const invoice of client.invoices) {
        const daysOverdue = Math.floor(
          (startOfToday.getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000)
        );
        const overdueAmount = Number(invoice.total) - Number(invoice.paidAmount);

        if (overdueAmount <= 0) continue;

        let bucket: keyof typeof buckets;
        if (daysOverdue >= 1 && daysOverdue <= 7) {
          bucket = '1-7';
        } else if (daysOverdue >= 8 && daysOverdue <= 14) {
          bucket = '8-14';
        } else if (daysOverdue >= 15 && daysOverdue <= 30) {
          bucket = '15-30';
        } else if (daysOverdue > 30) {
          bucket = '30+';
        } else {
          continue; // 0 or negative days, not truly overdue
        }

        buckets[bucket].clientIds.add(client.id);
        buckets[bucket].amount += overdueAmount;
      }
    }

    return {
      '1-7': { clients: buckets['1-7'].clientIds.size, amount: buckets['1-7'].amount },
      '8-14': { clients: buckets['8-14'].clientIds.size, amount: buckets['8-14'].amount },
      '15-30': { clients: buckets['15-30'].clientIds.size, amount: buckets['15-30'].amount },
      '30+': { clients: buckets['30+'].clientIds.size, amount: buckets['30+'].amount },
    };
  }

  // --------------------------------------------------------------------------
  // (e) Recent Visits
  // --------------------------------------------------------------------------

  private async getRecentVisits(userId: string, role: string) {
    const where: Prisma.RecoveryVisitWhereInput =
      role === 'RECOVERY_AGENT' ? { visitedBy: userId } : {};

    const visits = await prisma.recoveryVisit.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return visits.map((v) => ({
      id: v.id,
      visitNumber: v.visitNumber,
      visitDate: v.visitDate,
      clientId: v.client.id,
      clientName: v.client.name,
      outcome: v.outcome,
      amountCollected: Number(v.amountCollected),
    }));
  }

  // --------------------------------------------------------------------------
  // (f) Alert Count
  // --------------------------------------------------------------------------

  private async getAlertCount(userId: string, role: string) {
    const count = await prisma.alert.count({
      where: {
        acknowledged: false,
        OR: [
          { targetUserId: userId },
          { targetRole: role },
        ],
      },
    });

    return count;
  }

  // --------------------------------------------------------------------------
  // (g) Fulfillment Rate
  // --------------------------------------------------------------------------

  private async getFulfillmentRate(userId: string, role: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clientFilter: Prisma.PaymentPromiseWhereInput =
      role === 'RECOVERY_AGENT'
        ? { OR: [{ client: { recoveryAgentId: userId } }, { createdBy: userId }] }
        : {};

    const baseWhere: Prisma.PaymentPromiseWhereInput = {
      createdAt: { gte: thirtyDaysAgo },
      ...clientFilter,
    };

    const [fulfilled, total] = await Promise.all([
      prisma.paymentPromise.count({
        where: {
          ...baseWhere,
          status: 'FULFILLED',
        },
      }),
      prisma.paymentPromise.count({
        where: {
          ...baseWhere,
          status: { in: ['FULFILLED', 'BROKEN', 'PARTIAL'] },
        },
      }),
    ]);

    const rate = total > 0 ? Math.round((fulfilled / total) * 10000) / 100 : 0;

    return {
      fulfilled,
      total,
      rate,
    };
  }

  // --------------------------------------------------------------------------
  // (h) Top Overdue Clients
  // --------------------------------------------------------------------------

  private async getTopOverdueClients(agentFilter: Prisma.ClientWhereInput) {
    // Get top 5 clients by balance descending, with balance > 0
    const clients = await prisma.client.findMany({
      where: {
        balance: { gt: 0 },
        status: 'ACTIVE',
        ...agentFilter,
      },
      select: {
        id: true,
        name: true,
        balance: true,
        city: true,
        recoveryVisits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: { visitDate: true },
        },
      },
      orderBy: { balance: 'desc' },
      take: 5,
    });

    return clients.map((c) => ({
      id: c.id,
      name: c.name,
      balance: Number(c.balance),
      city: c.city,
      lastVisitDate: c.recoveryVisits.length > 0 ? c.recoveryVisits[0].visitDate : null,
    }));
  }
}

export const recoveryDashboardService = new RecoveryDashboardService();
