import { Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

interface AgentPerformanceSummary {
  agentId: string;
  agentName: string;
  agentEmail: string;
  totalVisits: number;
  visitsByOutcome: Record<string, number>;
  totalCollected: number;
  promiseStats: {
    total: number;
    fulfilled: number;
    broken: number;
    pending: number;
    partial: number;
    cancelled: number;
    fulfillmentRate: number;
  };
  assignedClients: number;
}

interface AgentListSummary {
  agentId: string;
  agentName: string;
  agentEmail: string;
  totalVisits: number;
  totalCollected: number;
  assignedClients: number;
  fulfillmentRate: number;
}

export class AgentPerformanceService {
  private prisma: any;

  constructor(prismaClient?: any) {
    this.prisma = prismaClient || defaultPrisma;
  }

  /**
   * Get detailed performance metrics for a single recovery agent.
   */
  async getAgentPerformance(
    agentId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AgentPerformanceSummary> {
    // Build date filter for visits and promises
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Get agent user info
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, email: true },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // 2. Build visit where clause
    const visitWhere: Prisma.RecoveryVisitWhereInput = {
      visitedBy: agentId,
    };
    if (hasDateFilter) {
      visitWhere.visitDate = dateFilter;
    }

    // 3. Count total visits in period
    const totalVisits = await this.prisma.recoveryVisit.count({
      where: visitWhere,
    });

    // 4. Count visits grouped by outcome
    const visitsByOutcomeRaw = await this.prisma.recoveryVisit.groupBy({
      by: ['outcome'],
      where: visitWhere,
      _count: { id: true },
    });

    const visitsByOutcome: Record<string, number> = {};
    for (const row of visitsByOutcomeRaw) {
      visitsByOutcome[row.outcome] = row._count.id;
    }

    // 5. Total amount collected (sum amountCollected where amountCollected > 0)
    const collectionAgg = await this.prisma.recoveryVisit.aggregate({
      where: {
        ...visitWhere,
        amountCollected: { gt: 0 },
      },
      _sum: { amountCollected: true },
    });
    const totalCollected = collectionAgg._sum.amountCollected
      ? parseFloat(collectionAgg._sum.amountCollected.toString())
      : 0;

    // 6. Promise stats
    const promiseWhere: Prisma.PaymentPromiseWhereInput = {
      createdBy: agentId,
    };
    if (hasDateFilter) {
      promiseWhere.createdAt = dateFilter;
    }

    const [totalPromises, promisesByStatus] = await Promise.all([
      this.prisma.paymentPromise.count({ where: promiseWhere }),
      this.prisma.paymentPromise.groupBy({
        by: ['status'],
        where: promiseWhere,
        _count: { id: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of promisesByStatus) {
      statusCounts[row.status] = row._count.id;
    }

    const fulfilled = statusCounts['FULFILLED'] || 0;
    const broken = statusCounts['BROKEN'] || 0;
    const pending = statusCounts['PENDING'] || 0;
    const partial = statusCounts['PARTIAL'] || 0;
    const cancelled = statusCounts['CANCELLED'] || 0;

    // Fulfillment rate = fulfilled / (fulfilled + broken) * 100
    const fulfillmentDenominator = fulfilled + broken;
    const fulfillmentRate = fulfillmentDenominator > 0
      ? Math.round((fulfilled / fulfillmentDenominator) * 10000) / 100
      : 0;

    // 7. Assigned clients count
    const assignedClients = await this.prisma.client.count({
      where: { recoveryAgentId: agentId },
    });

    logger.info('Agent performance computed', { agentId, totalVisits, totalCollected });

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentEmail: agent.email,
      totalVisits,
      visitsByOutcome,
      totalCollected: Math.round(totalCollected * 100) / 100,
      promiseStats: {
        total: totalPromises,
        fulfilled,
        broken,
        pending,
        partial,
        cancelled,
        fulfillmentRate,
      },
      assignedClients,
    };
  }

  /**
   * Get performance summaries for all recovery agents.
   * Uses efficient aggregation queries rather than calling getAgentPerformance per agent.
   */
  async getAllAgentsPerformance(
    dateFrom?: string,
    dateTo?: string
  ): Promise<AgentListSummary[]> {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Get all users with role RECOVERY_AGENT
    const agents = await this.prisma.user.findMany({
      where: {
        role: { name: 'RECOVERY_AGENT' },
        status: 'active',
      },
      select: { id: true, name: true, email: true },
    });

    if (agents.length === 0) {
      return [];
    }

    const agentIds = agents.map((a: any) => a.id);

    // 2. Visit counts per agent
    const visitWhere: Prisma.RecoveryVisitWhereInput = {
      visitedBy: { in: agentIds },
    };
    if (hasDateFilter) {
      visitWhere.visitDate = dateFilter;
    }

    const visitCounts = await this.prisma.recoveryVisit.groupBy({
      by: ['visitedBy'],
      where: visitWhere,
      _count: { id: true },
    });
    const visitCountMap = new Map<string, number>();
    for (const row of visitCounts) {
      visitCountMap.set(row.visitedBy, row._count.id);
    }

    // 3. Total collected per agent
    const collectionAgg = await this.prisma.recoveryVisit.groupBy({
      by: ['visitedBy'],
      where: {
        ...visitWhere,
        amountCollected: { gt: 0 },
      },
      _sum: { amountCollected: true },
    });
    const collectionMap = new Map<string, number>();
    for (const row of collectionAgg) {
      collectionMap.set(
        row.visitedBy,
        row._sum.amountCollected ? parseFloat(row._sum.amountCollected.toString()) : 0
      );
    }

    // 4. Assigned clients per agent
    const clientCounts = await this.prisma.client.groupBy({
      by: ['recoveryAgentId'],
      where: {
        recoveryAgentId: { in: agentIds },
      },
      _count: { id: true },
    });
    const clientCountMap = new Map<string, number>();
    for (const row of clientCounts) {
      if (row.recoveryAgentId) {
        clientCountMap.set(row.recoveryAgentId, row._count.id);
      }
    }

    // 5. Promise stats per agent (fulfilled and broken counts for fulfillment rate)
    const promiseWhere: Prisma.PaymentPromiseWhereInput = {
      createdBy: { in: agentIds },
    };
    if (hasDateFilter) {
      promiseWhere.createdAt = dateFilter;
    }

    const promiseStatusCounts = await this.prisma.paymentPromise.groupBy({
      by: ['createdBy', 'status'],
      where: promiseWhere,
      _count: { id: true },
    });

    // Build map: agentId -> { fulfilled, broken }
    const promiseMap = new Map<string, { fulfilled: number; broken: number }>();
    for (const row of promiseStatusCounts) {
      const existing = promiseMap.get(row.createdBy) || { fulfilled: 0, broken: 0 };
      if (row.status === 'FULFILLED') {
        existing.fulfilled = row._count.id;
      } else if (row.status === 'BROKEN') {
        existing.broken = row._count.id;
      }
      promiseMap.set(row.createdBy, existing);
    }

    // 6. Assemble results
    const results: AgentListSummary[] = agents.map((agent: any) => {
      const totalVisits = visitCountMap.get(agent.id) || 0;
      const totalCollected = collectionMap.get(agent.id) || 0;
      const assignedClients = clientCountMap.get(agent.id) || 0;
      const promiseData = promiseMap.get(agent.id) || { fulfilled: 0, broken: 0 };
      const denominator = promiseData.fulfilled + promiseData.broken;
      const fulfillmentRate = denominator > 0
        ? Math.round((promiseData.fulfilled / denominator) * 10000) / 100
        : 0;

      return {
        agentId: agent.id,
        agentName: agent.name,
        agentEmail: agent.email,
        totalVisits,
        totalCollected: Math.round(totalCollected * 100) / 100,
        assignedClients,
        fulfillmentRate,
      };
    });

    // Sort by total collected descending
    results.sort((a, b) => b.totalCollected - a.totalCollected);

    logger.info('All agents performance computed', { agentCount: results.length });

    return results;
  }
}
