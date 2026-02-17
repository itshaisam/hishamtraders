import { prisma, getTenantId } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';

export interface CreateReconciliationDto {
  bankAccountId: string;
  statementDate: string;
  statementBalance: number;
}

export interface AddStatementItemDto {
  description: string;
  statementAmount: number;
  statementDate: string;
}

export interface ReconciliationFilters {
  bankAccountId?: string;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  page?: number;
  limit?: number;
}

export class BankReconciliationService {
  /**
   * List reconciliation sessions with filters
   */
  async getAll(filters: ReconciliationFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.bankAccountId) where.bankAccountId = filters.bankAccountId;
    if (filters.status) where.status = filters.status;

    const [sessions, total] = await Promise.all([
      prisma.bankReconciliation.findMany({
        where,
        include: {
          bankAccount: { select: { id: true, code: true, name: true } },
          reconciler: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bankReconciliation.count({ where }),
    ]);

    return {
      sessions: sessions.map((s) => ({
        ...s,
        statementBalance: parseFloat(s.statementBalance.toString()),
        systemBalance: parseFloat(s.systemBalance.toString()),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new reconciliation session
   */
  async create(dto: CreateReconciliationDto, userId: string) {
    // Validate bank account exists and is a bank account
    const bankAccount = await prisma.accountHead.findUnique({
      where: { id: dto.bankAccountId },
      select: { id: true, code: true, name: true, currentBalance: true },
    });

    if (!bankAccount) {
      throw new NotFoundError('Bank account not found');
    }

    if (!bankAccount.code.startsWith('11')) {
      throw new BadRequestError('Selected account is not a bank account');
    }

    // Get system balance (current balance of the account)
    const systemBalance = parseFloat(bankAccount.currentBalance.toString());

    const session = await prisma.bankReconciliation.create({
      data: {
        tenantId: getTenantId(),
        bankAccountId: dto.bankAccountId,
        statementDate: new Date(dto.statementDate),
        statementBalance: dto.statementBalance,
        systemBalance,
        reconciledBy: userId,
      },
      include: {
        bankAccount: { select: { id: true, code: true, name: true } },
        reconciler: { select: { id: true, name: true } },
      },
    });

    logger.info('Bank reconciliation session created', {
      id: session.id,
      bankAccount: bankAccount.name,
      statementBalance: dto.statementBalance,
      systemBalance,
    });

    return {
      ...session,
      statementBalance: parseFloat(session.statementBalance.toString()),
      systemBalance: parseFloat(session.systemBalance.toString()),
    };
  }

  /**
   * Get a reconciliation session by ID with all items
   */
  async getById(id: string) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id },
      include: {
        bankAccount: { select: { id: true, code: true, name: true } },
        reconciler: { select: { id: true, name: true } },
        items: {
          include: {
            journalEntryLine: {
              include: {
                journalEntry: {
                  select: { id: true, entryNumber: true, date: true, description: true },
                },
                accountHead: { select: { id: true, code: true, name: true } },
              },
            },
          },
          orderBy: { statementDate: 'asc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    return {
      ...session,
      statementBalance: parseFloat(session.statementBalance.toString()),
      systemBalance: parseFloat(session.systemBalance.toString()),
      items: session.items.map((item) => ({
        ...item,
        statementAmount: parseFloat(item.statementAmount.toString()),
      })),
    };
  }

  /**
   * Add a statement item to a reconciliation session
   */
  async addItem(reconciliationId: string, dto: AddStatementItemDto) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot add items to a completed reconciliation');
    }

    const item = await prisma.bankReconciliationItem.create({
      data: {
        tenantId: getTenantId(),
        reconciliationId,
        description: dto.description,
        statementAmount: dto.statementAmount,
        statementDate: new Date(dto.statementDate),
      },
    });

    return {
      ...item,
      statementAmount: parseFloat(item.statementAmount.toString()),
    };
  }

  /**
   * Get unmatched system transactions (journal lines for the bank account in the period)
   */
  async getUnmatchedTransactions(reconciliationId: string) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        bankAccount: { select: { id: true } },
        items: { select: { journalEntryLineId: true }, where: { journalEntryLineId: { not: null } } },
      },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    // Get IDs of already-matched journal lines
    const matchedLineIds = session.items
      .map((i) => i.journalEntryLineId)
      .filter((id): id is string => id !== null);

    // Find journal entry lines for this bank account that are NOT yet matched
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        accountHeadId: session.bankAccount.id,
        journalEntry: { status: 'POSTED' },
        id: { notIn: matchedLineIds },
      },
      include: {
        journalEntry: {
          select: { id: true, entryNumber: true, date: true, description: true, referenceType: true },
        },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    return lines.map((l) => ({
      id: l.id,
      entryNumber: l.journalEntry.entryNumber,
      date: l.journalEntry.date,
      description: l.journalEntry.description,
      referenceType: l.journalEntry.referenceType,
      debit: parseFloat(l.debitAmount.toString()),
      credit: parseFloat(l.creditAmount.toString()),
      netAmount: parseFloat(l.debitAmount.toString()) - parseFloat(l.creditAmount.toString()),
    }));
  }

  /**
   * Match a statement item to a journal entry line
   */
  async matchItem(reconciliationId: string, itemId: string, journalEntryLineId: string) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot modify a completed reconciliation');
    }

    // Verify item belongs to this session
    const item = await prisma.bankReconciliationItem.findFirst({
      where: { id: itemId, reconciliationId },
    });

    if (!item) {
      throw new NotFoundError('Statement item not found in this reconciliation');
    }

    // Update the item with the match
    const updated = await prisma.bankReconciliationItem.update({
      where: { id: itemId },
      data: {
        journalEntryLineId,
        matched: true,
      },
      include: {
        journalEntryLine: {
          include: {
            journalEntry: {
              select: { id: true, entryNumber: true, date: true, description: true },
            },
          },
        },
      },
    });

    return {
      ...updated,
      statementAmount: parseFloat(updated.statementAmount.toString()),
    };
  }

  /**
   * Unmatch a statement item
   */
  async unmatchItem(reconciliationId: string, itemId: string) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot modify a completed reconciliation');
    }

    const updated = await prisma.bankReconciliationItem.update({
      where: { id: itemId },
      data: {
        journalEntryLineId: null,
        matched: false,
      },
    });

    return {
      ...updated,
      statementAmount: parseFloat(updated.statementAmount.toString()),
    };
  }

  /**
   * Delete a statement item
   */
  async deleteItem(reconciliationId: string, itemId: string) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Cannot modify a completed reconciliation');
    }

    await prisma.bankReconciliationItem.delete({ where: { id: itemId } });
  }

  /**
   * Complete a reconciliation session
   */
  async complete(reconciliationId: string) {
    const session = await prisma.bankReconciliation.findUnique({
      where: { id: reconciliationId },
      select: { id: true, status: true },
    });

    if (!session) {
      throw new NotFoundError('Reconciliation session not found');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Reconciliation is already completed');
    }

    const updated = await prisma.bankReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        bankAccount: { select: { id: true, code: true, name: true } },
        reconciler: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    logger.info('Bank reconciliation completed', {
      id: reconciliationId,
      bankAccount: updated.bankAccount.name,
    });

    return {
      ...updated,
      statementBalance: parseFloat(updated.statementBalance.toString()),
      systemBalance: parseFloat(updated.systemBalance.toString()),
    };
  }
}
