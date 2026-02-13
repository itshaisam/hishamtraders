import { Prisma, VisitOutcome, PromiseStatus, RecoveryDay } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';

// ============================================================================
// Helper: Map JS day-of-week (0=Sun..6=Sat) to RecoveryDay enum
// ============================================================================

const DAY_INDEX_TO_RECOVERY_DAY: Record<number, RecoveryDay> = {
  0: 'NONE',      // Sunday — not a recovery day
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

function getRecoveryDayFromDate(date: Date): RecoveryDay {
  return DAY_INDEX_TO_RECOVERY_DAY[date.getDay()] || 'NONE';
}

function getTodayRecoveryDay(): RecoveryDay {
  return getRecoveryDayFromDate(new Date());
}

// ============================================================================
// Interfaces
// ============================================================================

interface CreateVisitData {
  clientId: string;
  visitDate: Date;
  visitTime?: string;
  outcome: VisitOutcome;
  amountCollected?: number;
  promiseDate?: Date;
  promiseAmount?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface CreatePromiseData {
  clientId: string;
  promiseDate: Date;
  promiseAmount: number;
  notes?: string;
}

// ============================================================================
// RecoveryService
// ============================================================================

export class RecoveryService {

  // --------------------------------------------------------------------------
  // RECOVERY SCHEDULE (Story 7.1 + 7.2)
  // --------------------------------------------------------------------------

  /**
   * Get clients grouped by RecoveryDay.
   * If a date string is provided, determine the corresponding day of week
   * and return only clients for that day. Otherwise return all grouped.
   */
  async getSchedule(date?: string) {
    let targetDay: RecoveryDay | undefined;

    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestError('Invalid date format');
      }
      targetDay = getRecoveryDayFromDate(parsed);
    }

    const where: Prisma.ClientWhereInput = {
      status: 'ACTIVE',
      recoveryDay: targetDay ? targetDay : { not: 'NONE' },
    };

    const clients = await prisma.client.findMany({
      where,
      include: {
        recoveryAgent: { select: { id: true, name: true, email: true } },
        recoveryVisits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: {
            id: true,
            visitDate: true,
            outcome: true,
            amountCollected: true,
          },
        },
      },
      orderBy: [{ recoveryDay: 'asc' }, { name: 'asc' }],
    });

    // Group by recoveryDay
    const grouped: Record<string, typeof clients> = {};
    for (const client of clients) {
      const day = client.recoveryDay || 'NONE';
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(client);
    }

    // Transform to include lastVisit shorthand
    const result: Record<string, Array<{
      id: string;
      name: string;
      phone: string | null;
      city: string | null;
      area: string | null;
      balance: Prisma.Decimal;
      creditLimit: Prisma.Decimal;
      recoveryAgent: { id: string; name: string; email: string } | null;
      lastVisit: {
        id: string;
        visitDate: Date;
        outcome: VisitOutcome;
        amountCollected: Prisma.Decimal;
      } | null;
    }>> = {};

    for (const [day, dayClients] of Object.entries(grouped)) {
      result[day] = dayClients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        city: c.city,
        area: c.area,
        balance: c.balance,
        creditLimit: c.creditLimit,
        recoveryAgent: c.recoveryAgent,
        lastVisit: c.recoveryVisits.length > 0 ? c.recoveryVisits[0] : null,
      }));
    }

    return result;
  }

  /**
   * Get today's recovery route for the given user.
   * RECOVERY_AGENT: only their assigned clients for today's day.
   * ADMIN: all clients for today's day.
   */
  async getTodayRoute(userId: string, role: string) {
    const todayDay = getTodayRecoveryDay();

    if (todayDay === 'NONE') {
      return { day: todayDay, clients: [] };
    }

    const where: Prisma.ClientWhereInput = {
      status: 'ACTIVE',
      recoveryDay: todayDay,
    };

    if (role === 'RECOVERY_AGENT') {
      where.recoveryAgentId = userId;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        recoveryAgent: { select: { id: true, name: true } },
        recoveryVisits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: {
            id: true,
            visitDate: true,
            outcome: true,
            amountCollected: true,
          },
        },
        paymentPromises: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      day: todayDay,
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        city: c.city,
        area: c.area,
        balance: c.balance,
        creditLimit: c.creditLimit,
        recoveryAgent: c.recoveryAgent,
        lastVisit: c.recoveryVisits.length > 0 ? c.recoveryVisits[0] : null,
        pendingPromises: c.paymentPromises.length,
      })),
    };
  }

  /**
   * Get all users with role RECOVERY_AGENT.
   */
  async getRecoveryAgents() {
    const agents = await prisma.user.findMany({
      where: {
        status: 'active',
        role: { name: 'RECOVERY_AGENT' },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        _count: {
          select: {
            recoveryClients: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return agents;
  }

  // --------------------------------------------------------------------------
  // RECOVERY VISITS (Story 7.4)
  // --------------------------------------------------------------------------

  /**
   * Generate a visit number: RV-YYYYMMDD-XXXX (4-digit sequential per day).
   */
  private async generateVisitNumber(visitDate: Date): Promise<string> {
    const dateStr = visitDate.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(visitDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(visitDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.recoveryVisit.count({
      where: {
        visitDate: { gte: startOfDay, lte: endOfDay },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `RV-${dateStr}-${seq}`;
  }

  /**
   * Create a RecoveryVisit.
   * - If outcome is PAYMENT_COLLECTED, amountCollected must be > 0.
   * - If outcome is PROMISE_MADE, promiseDate and promiseAmount are required.
   * - Auto-creates a PaymentPromise when outcome is PROMISE_MADE.
   */
  async createVisit(data: CreateVisitData, userId: string) {
    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true },
    });
    if (!client) throw new NotFoundError('Client not found');

    // Validate outcome-specific fields
    if (data.outcome === 'PAYMENT_COLLECTED') {
      if (!data.amountCollected || data.amountCollected <= 0) {
        throw new BadRequestError('Amount collected must be greater than 0 when payment is collected');
      }
    }

    if (data.outcome === 'PROMISE_MADE') {
      if (!data.promiseDate) {
        throw new BadRequestError('Promise date is required when outcome is PROMISE_MADE');
      }
      if (!data.promiseAmount || data.promiseAmount <= 0) {
        throw new BadRequestError('Promise amount must be greater than 0 when outcome is PROMISE_MADE');
      }
    }

    const visitNumber = await this.generateVisitNumber(data.visitDate);

    const visit = await prisma.$transaction(async (tx) => {
      const created = await tx.recoveryVisit.create({
        data: {
          visitNumber,
          clientId: data.clientId,
          visitDate: data.visitDate,
          visitTime: data.visitTime,
          outcome: data.outcome,
          amountCollected: data.amountCollected || 0,
          promiseDate: data.promiseDate,
          promiseAmount: data.promiseAmount,
          notes: data.notes,
          visitedBy: userId,
          latitude: data.latitude,
          longitude: data.longitude,
        },
        include: {
          client: { select: { id: true, name: true, phone: true, city: true, area: true } },
          visitor: { select: { id: true, name: true } },
        },
      });

      // Auto-create PaymentPromise when outcome is PROMISE_MADE
      if (data.outcome === 'PROMISE_MADE' && data.promiseDate && data.promiseAmount) {
        await tx.paymentPromise.create({
          data: {
            clientId: data.clientId,
            promiseDate: data.promiseDate,
            promiseAmount: data.promiseAmount,
            status: 'PENDING',
            recoveryVisitId: created.id,
            notes: data.notes || `Promise created from visit ${visitNumber}`,
            createdBy: userId,
          },
        });
      }

      return created;
    });

    logger.info(`Recovery visit created: ${visitNumber}`, {
      id: visit.id,
      clientId: data.clientId,
      outcome: data.outcome,
    });

    return visit;
  }

  /**
   * Get paginated visit history for a client.
   */
  async getVisitHistory(clientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) throw new NotFoundError('Client not found');

    const [data, total] = await Promise.all([
      prisma.recoveryVisit.findMany({
        where: { clientId },
        include: {
          visitor: { select: { id: true, name: true } },
          paymentPromise: {
            select: {
              id: true,
              promiseDate: true,
              promiseAmount: true,
              status: true,
              actualPaymentDate: true,
              actualAmount: true,
            },
          },
        },
        orderBy: { visitDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.recoveryVisit.count({ where: { clientId } }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get visits by a specific user (recovery agent) with optional date range.
   */
  async getMyVisits(userId: string, dateFrom?: string, dateTo?: string) {
    const where: Prisma.RecoveryVisitWhereInput = {
      visitedBy: userId,
    };

    if (dateFrom || dateTo) {
      where.visitDate = {};
      if (dateFrom) where.visitDate.gte = new Date(dateFrom);
      if (dateTo) where.visitDate.lte = new Date(dateTo);
    }

    const visits = await prisma.recoveryVisit.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true, city: true, area: true } },
        paymentPromise: {
          select: {
            id: true,
            promiseDate: true,
            promiseAmount: true,
            status: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    return visits;
  }

  // --------------------------------------------------------------------------
  // PAYMENT PROMISES (Story 7.5)
  // --------------------------------------------------------------------------

  /**
   * Create a PaymentPromise directly (not from a visit).
   */
  async createPromise(data: CreatePromiseData, userId: string) {
    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true },
    });
    if (!client) throw new NotFoundError('Client not found');

    if (data.promiseAmount <= 0) {
      throw new BadRequestError('Promise amount must be greater than 0');
    }

    const promise = await prisma.paymentPromise.create({
      data: {
        clientId: data.clientId,
        promiseDate: data.promiseDate,
        promiseAmount: data.promiseAmount,
        status: 'PENDING',
        notes: data.notes,
        createdBy: userId,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    logger.info(`Payment promise created for client ${client.name}`, {
      id: promise.id,
      clientId: data.clientId,
      amount: data.promiseAmount,
    });

    return promise;
  }

  /**
   * Mark a promise as FULFILLED with actualPaymentDate = now.
   */
  async fulfillPromise(id: string, userId: string) {
    const promise = await prisma.paymentPromise.findUnique({ where: { id } });
    if (!promise) throw new NotFoundError('Payment promise not found');

    if (promise.status !== 'PENDING' && promise.status !== 'PARTIAL') {
      throw new BadRequestError(`Cannot fulfill promise with status ${promise.status}`);
    }

    const updated = await prisma.paymentPromise.update({
      where: { id },
      data: {
        status: 'FULFILLED',
        actualPaymentDate: new Date(),
        actualAmount: promise.promiseAmount,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    logger.info(`Payment promise fulfilled: ${id}`, {
      clientId: updated.clientId,
    });

    return updated;
  }

  /**
   * Mark a promise as CANCELLED.
   */
  async cancelPromise(id: string, userId: string) {
    const promise = await prisma.paymentPromise.findUnique({ where: { id } });
    if (!promise) throw new NotFoundError('Payment promise not found');

    if (promise.status === 'FULFILLED' || promise.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel promise with status ${promise.status}`);
    }

    const updated = await prisma.paymentPromise.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    logger.info(`Payment promise cancelled: ${id}`, {
      clientId: updated.clientId,
    });

    return updated;
  }

  /**
   * Get due promises (promiseDate <= today and status = PENDING).
   * If role is RECOVERY_AGENT, filter by client.recoveryAgentId = userId.
   */
  async getDuePromises(userId: string, role: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const where: Prisma.PaymentPromiseWhereInput = {
      promiseDate: { lte: today },
      status: 'PENDING',
    };

    if (role === 'RECOVERY_AGENT') {
      where.client = { recoveryAgentId: userId };
    }

    const promises = await prisma.paymentPromise.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            area: true,
            balance: true,
            recoveryAgent: { select: { id: true, name: true } },
          },
        },
        recoveryVisit: {
          select: { id: true, visitNumber: true, visitDate: true },
        },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { promiseDate: 'asc' },
    });

    return promises;
  }

  /**
   * Get all promises for a given client.
   */
  async getClientPromises(clientId: string) {
    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) throw new NotFoundError('Client not found');

    const promises = await prisma.paymentPromise.findMany({
      where: { clientId },
      include: {
        recoveryVisit: {
          select: { id: true, visitNumber: true, visitDate: true, outcome: true },
        },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { promiseDate: 'desc' },
    });

    return promises;
  }

  /**
   * FIFO matching of a payment amount against PENDING promises for a client.
   * Matches amounts sequentially by promiseDate ascending.
   * Marks matched promises as FULFILLED or PARTIAL.
   */
  async matchPaymentToPromises(
    clientId: string,
    amount: number,
    date: Date,
    userId: string
  ) {
    if (amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    // Fetch PENDING promises for the client ordered by promiseDate ASC (FIFO)
    const pendingPromises = await prisma.paymentPromise.findMany({
      where: {
        clientId,
        status: 'PENDING',
      },
      orderBy: { promiseDate: 'asc' },
    });

    if (pendingPromises.length === 0) {
      logger.info(`No pending promises to match for client ${clientId}`);
      return { matched: [], remainingAmount: amount };
    }

    let remaining = amount;
    const matched: Array<{
      promiseId: string;
      promiseAmount: number;
      matchedAmount: number;
      status: PromiseStatus;
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const promise of pendingPromises) {
        if (remaining <= 0) break;

        const promiseAmt = Number(promise.promiseAmount);

        if (remaining >= promiseAmt) {
          // Fully fulfilled
          await tx.paymentPromise.update({
            where: { id: promise.id },
            data: {
              status: 'FULFILLED',
              actualPaymentDate: date,
              actualAmount: promiseAmt,
            },
          });

          matched.push({
            promiseId: promise.id,
            promiseAmount: promiseAmt,
            matchedAmount: promiseAmt,
            status: 'FULFILLED',
          });

          remaining -= promiseAmt;
        } else {
          // Partially fulfilled
          await tx.paymentPromise.update({
            where: { id: promise.id },
            data: {
              status: 'PARTIAL',
              actualPaymentDate: date,
              actualAmount: remaining,
            },
          });

          matched.push({
            promiseId: promise.id,
            promiseAmount: promiseAmt,
            matchedAmount: remaining,
            status: 'PARTIAL',
          });

          remaining = 0;
        }
      }
    });

    logger.info(`Payment matched to ${matched.length} promises for client ${clientId}`, {
      totalAmount: amount,
      remaining,
    });

    return { matched, remainingAmount: remaining };
  }

  /**
   * Calculate promise fulfillment rate: fulfilled / total ratio.
   * Optionally filter by agentId and date range.
   */
  async getPromiseFulfillmentRate(
    agentId?: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    const where: Prisma.PaymentPromiseWhereInput = {};

    if (agentId) {
      where.client = { recoveryAgentId: agentId };
    }

    if (dateFrom || dateTo) {
      where.promiseDate = {};
      if (dateFrom) where.promiseDate.gte = new Date(dateFrom);
      if (dateTo) where.promiseDate.lte = new Date(dateTo);
    }

    const [total, fulfilled, partial, broken, pending] = await Promise.all([
      prisma.paymentPromise.count({ where }),
      prisma.paymentPromise.count({ where: { ...where, status: 'FULFILLED' } }),
      prisma.paymentPromise.count({ where: { ...where, status: 'PARTIAL' } }),
      prisma.paymentPromise.count({ where: { ...where, status: 'BROKEN' } }),
      prisma.paymentPromise.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    const fulfillmentRate = total > 0 ? (fulfilled / total) * 100 : 0;
    const partialRate = total > 0 ? (partial / total) * 100 : 0;
    const brokenRate = total > 0 ? (broken / total) * 100 : 0;

    return {
      total,
      fulfilled,
      partial,
      broken,
      pending,
      cancelled: total - fulfilled - partial - broken - pending,
      fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      partialRate: Math.round(partialRate * 100) / 100,
      brokenRate: Math.round(brokenRate * 100) / 100,
    };
  }
}

export const recoveryService = new RecoveryService();
