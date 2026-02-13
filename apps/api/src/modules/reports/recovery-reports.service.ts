import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as prismaClient } from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

interface VisitActivityFilters {
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  outcome?: string;
  page?: number;
  limit?: number;
}

interface CollectionSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
  agentId?: string;
}

interface OverdueClientsFilters {
  minDaysOverdue?: number;
  city?: string;
  agentId?: string;
  page?: number;
  limit?: number;
}

interface AgentProductivityFilters {
  dateFrom?: string;
  dateTo?: string;
}

export class RecoveryReportsService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || prismaClient;
  }

  /**
   * Visit Activity Report
   * Lists recovery visits with filters, includes client/visitor info and summary stats
   */
  async visitActivityReport(filters: VisitActivityFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.RecoveryVisitWhereInput = {};

    if (filters.agentId) {
      where.visitedBy = filters.agentId;
    }
    if (filters.outcome) {
      where.outcome = filters.outcome as any;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.visitDate = {};
      if (filters.dateFrom) where.visitDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.visitDate.lte = new Date(filters.dateTo);
    }

    const [visits, total] = await Promise.all([
      this.prisma.recoveryVisit.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, city: true } },
          visitor: { select: { id: true, name: true } },
        },
        orderBy: { visitDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recoveryVisit.count({ where }),
    ]);

    // Fetch all matching visits for summary (not just the page)
    const allVisits = await this.prisma.recoveryVisit.findMany({
      where,
      select: { outcome: true, amountCollected: true },
    });

    // Build summary
    const visitsByOutcome = new Map<string, number>();
    let totalCollected = 0;

    for (const v of allVisits) {
      const outcomeKey = v.outcome;
      visitsByOutcome.set(outcomeKey, (visitsByOutcome.get(outcomeKey) || 0) + 1);
      totalCollected += parseFloat(v.amountCollected.toString());
    }

    const summary = {
      totalVisits: allVisits.length,
      visitsByOutcome: Array.from(visitsByOutcome.entries()).map(([outcome, count]) => ({
        outcome,
        count,
      })),
      totalCollected: Math.round(totalCollected * 100) / 100,
    };

    const data = visits.map((v) => ({
      id: v.id,
      visitNumber: v.visitNumber,
      clientId: v.clientId,
      clientName: v.client.name,
      clientCity: v.client.city,
      visitDate: v.visitDate.toISOString(),
      visitTime: v.visitTime,
      outcome: v.outcome,
      amountCollected: parseFloat(v.amountCollected.toString()),
      promiseDate: v.promiseDate ? v.promiseDate.toISOString() : null,
      promiseAmount: v.promiseAmount ? parseFloat(v.promiseAmount.toString()) : null,
      notes: v.notes,
      visitorId: v.visitedBy,
      visitorName: v.visitor.name,
      latitude: v.latitude,
      longitude: v.longitude,
      createdAt: v.createdAt.toISOString(),
    }));

    return {
      data,
      summary,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Collection Summary Report
   * Aggregates collections by agent and by day for a given period
   */
  async collectionSummaryReport(filters: CollectionSummaryFilters) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    // --- Agent collections from RecoveryVisit (amountCollected > 0) ---
    const visitWhere: Prisma.RecoveryVisitWhereInput = {
      amountCollected: { gt: 0 },
      visitDate: { gte: dateFrom, lte: dateTo },
    };
    if (filters.agentId) {
      visitWhere.visitedBy = filters.agentId;
    }

    const visits = await this.prisma.recoveryVisit.findMany({
      where: visitWhere,
      select: {
        visitedBy: true,
        amountCollected: true,
        visitDate: true,
        visitor: { select: { id: true, name: true } },
      },
    });

    // Group by agent
    const agentMap = new Map<string, { agentName: string; totalCollected: number; visitCount: number }>();
    for (const v of visits) {
      const existing = agentMap.get(v.visitedBy) || {
        agentName: v.visitor.name,
        totalCollected: 0,
        visitCount: 0,
      };
      existing.totalCollected += parseFloat(v.amountCollected.toString());
      existing.visitCount += 1;
      agentMap.set(v.visitedBy, existing);
    }

    const agentCollections = Array.from(agentMap.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: data.agentName,
      totalCollected: Math.round(data.totalCollected * 100) / 100,
      visitCount: data.visitCount,
    }));

    // Sort by totalCollected descending
    agentCollections.sort((a, b) => b.totalCollected - a.totalCollected);

    // --- Total collected via formal payments (paymentType = CLIENT) ---
    const paymentWhere: Prisma.PaymentWhereInput = {
      paymentType: 'CLIENT',
      date: { gte: dateFrom, lte: dateTo },
    };
    if (filters.agentId) {
      paymentWhere.recordedBy = filters.agentId;
    }

    const formalPayments = await this.prisma.payment.findMany({
      where: paymentWhere,
      select: { amount: true, date: true },
    });

    let formalTotal = 0;
    for (const p of formalPayments) {
      formalTotal += parseFloat(p.amount.toString());
    }

    // --- Daily collections (from visits) ---
    const dailyMap = new Map<string, number>();
    for (const v of visits) {
      const dayKey = v.visitDate.toISOString().split('T')[0];
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + parseFloat(v.amountCollected.toString()));
    }

    // Also add formal payment amounts per day
    for (const p of formalPayments) {
      const dayKey = p.date.toISOString().split('T')[0];
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + parseFloat(p.amount.toString()));
    }

    const dailyCollections = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Total collected = visit collections + formal payments
    let visitTotal = 0;
    for (const v of visits) {
      visitTotal += parseFloat(v.amountCollected.toString());
    }
    const totalCollected = Math.round((visitTotal + formalTotal) * 100) / 100;

    return {
      agentCollections,
      dailyCollections,
      totalCollected,
      period: {
        from: dateFrom.toISOString().split('T')[0],
        to: dateTo.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Overdue Clients Report
   * Finds clients with overdue invoices and calculates overdue amounts/days
   */
  async overdueClientsReport(filters: OverdueClientsFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const now = new Date();

    // First get clients with overdue invoices
    const clientWhere: Prisma.ClientWhereInput = {
      invoices: {
        some: {
          dueDate: { lt: now },
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
      },
    };

    if (filters.city) {
      clientWhere.city = filters.city;
    }
    if (filters.agentId) {
      clientWhere.recoveryAgentId = filters.agentId;
    }

    const clients = await this.prisma.client.findMany({
      where: clientWhere,
      select: {
        id: true,
        name: true,
        city: true,
        area: true,
        phone: true,
        recoveryAgentId: true,
        recoveryAgent: { select: { id: true, name: true } },
        invoices: {
          where: {
            dueDate: { lt: now },
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
          select: {
            id: true,
            invoiceNumber: true,
            dueDate: true,
            total: true,
            paidAmount: true,
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    // Calculate overdue data per client
    const rows: Array<{
      clientId: string;
      clientName: string;
      city: string | null;
      area: string | null;
      phone: string | null;
      recoveryAgentId: string | null;
      recoveryAgentName: string | null;
      overdueAmount: number;
      overdueInvoiceCount: number;
      daysOverdue: number;
      oldestDueDate: string;
      lastVisitDate: string | null;
      lastPromiseDate: string | null;
      lastPromiseAmount: number | null;
      lastPromiseStatus: string | null;
    }> = [];

    for (const client of clients) {
      let overdueAmount = 0;
      let oldestDueDate: Date | null = null;

      for (const inv of client.invoices) {
        const outstanding = parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString());
        if (outstanding > 0) {
          overdueAmount += outstanding;
          if (!oldestDueDate || inv.dueDate < oldestDueDate) {
            oldestDueDate = inv.dueDate;
          }
        }
      }

      if (overdueAmount <= 0 || !oldestDueDate) continue;

      const daysOverdue = Math.floor((now.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Apply minDaysOverdue filter
      if (filters.minDaysOverdue && daysOverdue < filters.minDaysOverdue) {
        continue;
      }

      rows.push({
        clientId: client.id,
        clientName: client.name,
        city: client.city,
        area: client.area,
        phone: client.phone,
        recoveryAgentId: client.recoveryAgentId,
        recoveryAgentName: client.recoveryAgent?.name || null,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        overdueInvoiceCount: client.invoices.length,
        daysOverdue,
        oldestDueDate: oldestDueDate.toISOString(),
        lastVisitDate: null,
        lastPromiseDate: null,
        lastPromiseAmount: null,
        lastPromiseStatus: null,
      });
    }

    // Sort by overdueAmount descending
    rows.sort((a, b) => b.overdueAmount - a.overdueAmount);

    // Fetch last visit date and last promise info for these clients
    const clientIds = rows.map((r) => r.clientId);

    if (clientIds.length > 0) {
      // Get last visit per client
      const lastVisits = await this.prisma.recoveryVisit.findMany({
        where: { clientId: { in: clientIds } },
        orderBy: { visitDate: 'desc' },
        select: { clientId: true, visitDate: true },
      });

      const lastVisitMap = new Map<string, Date>();
      for (const v of lastVisits) {
        if (!lastVisitMap.has(v.clientId)) {
          lastVisitMap.set(v.clientId, v.visitDate);
        }
      }

      // Get last promise per client
      const lastPromises = await this.prisma.paymentPromise.findMany({
        where: { clientId: { in: clientIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          clientId: true,
          promiseDate: true,
          promiseAmount: true,
          status: true,
        },
      });

      const lastPromiseMap = new Map<string, { promiseDate: Date; promiseAmount: Prisma.Decimal; status: string }>();
      for (const p of lastPromises) {
        if (!lastPromiseMap.has(p.clientId)) {
          lastPromiseMap.set(p.clientId, {
            promiseDate: p.promiseDate,
            promiseAmount: p.promiseAmount,
            status: p.status,
          });
        }
      }

      // Enrich rows
      for (const row of rows) {
        const lastVisit = lastVisitMap.get(row.clientId);
        if (lastVisit) {
          row.lastVisitDate = lastVisit.toISOString();
        }

        const lastPromise = lastPromiseMap.get(row.clientId);
        if (lastPromise) {
          row.lastPromiseDate = lastPromise.promiseDate.toISOString();
          row.lastPromiseAmount = parseFloat(lastPromise.promiseAmount.toString());
          row.lastPromiseStatus = lastPromise.status;
        }
      }
    }

    // Paginate in-memory (post filtering by minDaysOverdue is done above)
    const totalFiltered = rows.length;
    const paginatedRows = rows.slice((page - 1) * limit, page * limit);

    // Summary
    let totalOverdue = 0;
    for (const r of rows) {
      totalOverdue += r.overdueAmount;
    }

    return {
      data: paginatedRows,
      summary: {
        totalOverdue: Math.round(totalOverdue * 100) / 100,
        clientCount: totalFiltered,
      },
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
      },
    };
  }

  /**
   * Agent Productivity Report
   * Calculates productivity metrics for each recovery agent
   */
  async agentProductivityReport(filters: AgentProductivityFilters) {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();

    // Get all recovery agents (users assigned as recoveryAgent on at least one client OR with RECOVERY_AGENT role)
    const recoveryAgentRole = await this.prisma.role.findFirst({
      where: { name: 'RECOVERY_AGENT' },
      select: { id: true },
    });

    const agents = await this.prisma.user.findMany({
      where: {
        OR: [
          ...(recoveryAgentRole ? [{ roleId: recoveryAgentRole.id }] : []),
          { recoveryClients: { some: {} } },
        ],
        status: 'active',
      },
      select: { id: true, name: true },
    });

    // Get all visits in the period
    const allVisits = await this.prisma.recoveryVisit.findMany({
      where: {
        visitDate: { gte: dateFrom, lte: dateTo },
      },
      select: {
        visitedBy: true,
        clientId: true,
        amountCollected: true,
        visitDate: true,
      },
    });

    // Get all promises in the period
    const allPromises = await this.prisma.paymentPromise.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: {
        createdBy: true,
        status: true,
      },
    });

    // Get assigned clients per agent
    const clientAssignments = await this.prisma.client.findMany({
      where: {
        recoveryAgentId: { not: null },
        status: 'ACTIVE',
      },
      select: { recoveryAgentId: true },
    });

    // Build maps
    const assignedClientsMap = new Map<string, number>();
    for (const c of clientAssignments) {
      if (c.recoveryAgentId) {
        assignedClientsMap.set(c.recoveryAgentId, (assignedClientsMap.get(c.recoveryAgentId) || 0) + 1);
      }
    }

    // Calculate the number of days in the period
    const periodDays = Math.max(1, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)));

    // Build per-agent visit data
    const agentVisitData = new Map<string, { totalVisits: number; totalCollected: number; visitedClients: Set<string> }>();
    for (const v of allVisits) {
      const existing = agentVisitData.get(v.visitedBy) || {
        totalVisits: 0,
        totalCollected: 0,
        visitedClients: new Set<string>(),
      };
      existing.totalVisits += 1;
      existing.totalCollected += parseFloat(v.amountCollected.toString());
      existing.visitedClients.add(v.clientId);
      agentVisitData.set(v.visitedBy, existing);
    }

    // Build per-agent promise data
    const agentPromiseData = new Map<string, { promisesMade: number; promisesFulfilled: number }>();
    for (const p of allPromises) {
      const existing = agentPromiseData.get(p.createdBy) || {
        promisesMade: 0,
        promisesFulfilled: 0,
      };
      existing.promisesMade += 1;
      if (p.status === 'FULFILLED') {
        existing.promisesFulfilled += 1;
      }
      agentPromiseData.set(p.createdBy, existing);
    }

    // Build result rows
    const results = agents.map((agent) => {
      const visitData = agentVisitData.get(agent.id) || {
        totalVisits: 0,
        totalCollected: 0,
        visitedClients: new Set<string>(),
      };
      const promiseData = agentPromiseData.get(agent.id) || {
        promisesMade: 0,
        promisesFulfilled: 0,
      };
      const assignedClients = assignedClientsMap.get(agent.id) || 0;
      const visitedClients = visitData.visitedClients.size;

      const visitsPerDay = Math.round((visitData.totalVisits / periodDays) * 100) / 100;
      const avgCollectionPerVisit = visitData.totalVisits > 0
        ? Math.round((visitData.totalCollected / visitData.totalVisits) * 100) / 100
        : 0;
      const fulfillmentRate = promiseData.promisesMade > 0
        ? Math.round((promiseData.promisesFulfilled / promiseData.promisesMade) * 10000) / 100
        : 0;
      const clientCoverage = assignedClients > 0
        ? Math.round((visitedClients / assignedClients) * 10000) / 100
        : 0;

      return {
        agentId: agent.id,
        agentName: agent.name,
        totalVisits: visitData.totalVisits,
        visitsPerDay,
        totalCollected: Math.round(visitData.totalCollected * 100) / 100,
        avgCollectionPerVisit,
        promisesMade: promiseData.promisesMade,
        promisesFulfilled: promiseData.promisesFulfilled,
        fulfillmentRate,
        assignedClients,
        visitedClients,
        clientCoverage,
      };
    });

    // Sort by totalCollected descending
    results.sort((a, b) => b.totalCollected - a.totalCollected);

    return results;
  }
}
