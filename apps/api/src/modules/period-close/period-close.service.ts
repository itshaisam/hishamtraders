import { prisma, getTenantId } from '../../lib/prisma.js';
import { calculateBalanceChange } from '../../utils/balance-helper.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

export class PeriodCloseService {
  /**
   * List all period close records
   */
  async list() {
    return prisma.periodClose.findMany({
      orderBy: { periodDate: 'desc' },
      include: {
        closer: { select: { id: true, name: true } },
        closingJournalEntry: { select: { id: true, entryNumber: true } },
      },
    });
  }

  /**
   * Close a month: verify trial balance, calc net profit, create closing JE, mark CLOSED
   */
  async closeMonth(year: number, month: number, userId: string) {
    // Last day of the month
    const periodDate = new Date(year, month, 0); // month is 1-based, so new Date(2026, 1, 0) = Jan 31
    periodDate.setHours(0, 0, 0, 0);

    // Check if already closed
    const existing = await prisma.periodClose.findFirst({
      where: {
        periodType: 'MONTH',
        periodDate,
        status: 'CLOSED',
      },
    });

    if (existing) {
      throw new BadRequestError(`Period ${year}-${String(month).padStart(2, '0')} is already closed`);
    }

    // First day of the month
    const periodStart = new Date(year, month - 1, 1);
    periodStart.setHours(0, 0, 0, 0);

    return prisma.$transaction(async (tx: any) => {
      // 1. Verify trial balance is balanced (all posted entries up to period end)
      const allLines = await tx.journalEntryLine.findMany({
        where: {
          journalEntry: {
            status: 'POSTED',
            date: { lte: periodDate },
          },
        },
        select: { debitAmount: true, creditAmount: true },
      });

      const totalDebits = allLines.reduce((s: number, l: any) => s + parseFloat(l.debitAmount.toString()), 0);
      const totalCredits = allLines.reduce((s: number, l: any) => s + parseFloat(l.creditAmount.toString()), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new BadRequestError(
          `Trial balance is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`
        );
      }

      // 2. Calculate net profit for this period (Revenue - Expenses)
      const periodLines = await tx.journalEntryLine.findMany({
        where: {
          journalEntry: {
            status: 'POSTED',
            date: { gte: periodStart, lte: periodDate },
          },
        },
        include: {
          accountHead: { select: { id: true, code: true, accountType: true } },
        },
      });

      // Revenue accounts: credit-normal, so net = credits - debits
      let revenueTotal = 0;
      let expenseTotal = 0;
      const revenueAccounts: Map<string, { id: string; code: string; net: number }> = new Map();
      const expenseAccounts: Map<string, { id: string; code: string; net: number }> = new Map();

      for (const line of periodLines) {
        const debit = parseFloat(line.debitAmount.toString());
        const credit = parseFloat(line.creditAmount.toString());
        const { accountType, id, code } = line.accountHead;

        if (accountType === 'REVENUE') {
          const net = credit - debit;
          revenueTotal += net;
          const existing = revenueAccounts.get(id);
          if (existing) {
            existing.net += net;
          } else {
            revenueAccounts.set(id, { id, code, net });
          }
        } else if (accountType === 'EXPENSE') {
          const net = debit - credit;
          expenseTotal += net;
          const existing = expenseAccounts.get(id);
          if (existing) {
            existing.net += net;
          } else {
            expenseAccounts.set(id, { id, code, net });
          }
        }
      }

      const netProfit = Math.round((revenueTotal - expenseTotal) * 100) / 100;

      // 3. Create closing journal entry (zero out revenue/expense to Retained Earnings 3200)
      const retainedEarnings = await tx.accountHead.findFirst({
        where: { code: '3200' },
        select: { id: true, accountType: true },
      });

      if (!retainedEarnings) {
        throw new BadRequestError('Retained Earnings account (3200) not found. Cannot close period.');
      }

      // Build closing JE lines
      const closingLines: { accountHeadId: string; debitAmount: number; creditAmount: number; description: string }[] = [];

      // Zero out revenue accounts (they are credit-normal, so debit to zero them)
      for (const [, acct] of revenueAccounts) {
        if (Math.abs(acct.net) < 0.01) continue;
        if (acct.net > 0) {
          closingLines.push({
            accountHeadId: acct.id,
            debitAmount: Math.round(acct.net * 100) / 100,
            creditAmount: 0,
            description: `Close revenue ${acct.code}`,
          });
        } else {
          closingLines.push({
            accountHeadId: acct.id,
            debitAmount: 0,
            creditAmount: Math.round(Math.abs(acct.net) * 100) / 100,
            description: `Close revenue ${acct.code}`,
          });
        }
      }

      // Zero out expense accounts (they are debit-normal, so credit to zero them)
      for (const [, acct] of expenseAccounts) {
        if (Math.abs(acct.net) < 0.01) continue;
        if (acct.net > 0) {
          closingLines.push({
            accountHeadId: acct.id,
            debitAmount: 0,
            creditAmount: Math.round(acct.net * 100) / 100,
            description: `Close expense ${acct.code}`,
          });
        } else {
          closingLines.push({
            accountHeadId: acct.id,
            debitAmount: Math.round(Math.abs(acct.net) * 100) / 100,
            creditAmount: 0,
            description: `Close expense ${acct.code}`,
          });
        }
      }

      // Net profit to Retained Earnings (3200 is EQUITY = credit-normal)
      // If profit > 0: credit RE. If loss: debit RE.
      if (Math.abs(netProfit) >= 0.01) {
        if (netProfit > 0) {
          closingLines.push({
            accountHeadId: retainedEarnings.id,
            debitAmount: 0,
            creditAmount: Math.round(netProfit * 100) / 100,
            description: 'Net profit to Retained Earnings',
          });
        } else {
          closingLines.push({
            accountHeadId: retainedEarnings.id,
            debitAmount: Math.round(Math.abs(netProfit) * 100) / 100,
            creditAmount: 0,
            description: 'Net loss to Retained Earnings',
          });
        }
      }

      // Generate entry number
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(periodDate.getDate()).padStart(2, '0');
      const prefix = `JE-${year}${monthStr}${dayStr}-`;
      const latestEntry = await tx.journalEntry.findFirst({
        where: { entryNumber: { startsWith: prefix } },
        orderBy: { entryNumber: 'desc' },
        select: { entryNumber: true },
      });
      let nextSeq = 1;
      if (latestEntry) {
        const parts = latestEntry.entryNumber.split('-');
        nextSeq = parseInt(parts[parts.length - 1], 10) + 1;
      }
      const entryNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;

      let closingJournalEntryId: string | null = null;

      if (closingLines.length > 0) {
        // Validate balance
        const totalD = closingLines.reduce((s, l) => s + l.debitAmount, 0);
        const totalC = closingLines.reduce((s, l) => s + l.creditAmount, 0);
        if (Math.abs(totalD - totalC) > 0.01) {
          throw new BadRequestError(
            `Closing JE not balanced: debits ${totalD.toFixed(2)} != credits ${totalC.toFixed(2)}`
          );
        }

        const closingEntry = await tx.journalEntry.create({
          data: {
            tenantId: getTenantId(),
            entryNumber,
            date: periodDate,
            description: `Month-end closing ${year}-${monthStr}`,
            status: 'POSTED',
            referenceType: 'PERIOD_CLOSE',
            createdBy: userId,
            approvedBy: userId,
            lines: {
              create: closingLines.map((line) => ({ ...line, tenantId: getTenantId() })),
            },
          },
        });

        closingJournalEntryId = closingEntry.id;

        // Update account balances for closing lines
        for (const line of closingLines) {
          const account = await tx.accountHead.findUnique({
            where: { id: line.accountHeadId },
            select: { accountType: true },
          });
          if (account) {
            const change = calculateBalanceChange(
              account.accountType as any,
              line.debitAmount,
              line.creditAmount
            );
            await tx.accountHead.update({
              where: { id: line.accountHeadId },
              data: { currentBalance: { increment: change } },
            });
          }
        }
      }

      // 4. Create PeriodClose record
      const periodClose = await tx.periodClose.create({
        data: {
          tenantId: getTenantId(),
          periodType: 'MONTH',
          periodDate,
          netProfit,
          status: 'CLOSED',
          closedBy: userId,
          closingJournalEntryId,
        },
        include: {
          closer: { select: { id: true, name: true } },
          closingJournalEntry: { select: { id: true, entryNumber: true } },
        },
      });

      logger.info(`Period closed: ${year}-${monthStr}`, { netProfit, closingJournalEntryId });

      await AuditService.log({
        userId,
        action: 'CREATE',
        entityType: 'PeriodClose',
        entityId: periodClose.id,
        notes: `Closed month ${year}-${monthStr}. Net profit: ${netProfit}`,
      });

      return periodClose;
    });
  }

  /**
   * Reopen a closed period (ADMIN only)
   */
  async reopen(id: string, reason: string, userId: string) {
    const periodClose = await prisma.periodClose.findUnique({ where: { id } });

    if (!periodClose) {
      throw new NotFoundError('Period close record not found');
    }

    if (periodClose.status === 'REOPENED') {
      throw new BadRequestError('Period is already reopened');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('Reopen reason is required');
    }

    const updated = await prisma.periodClose.update({
      where: { id },
      data: {
        status: 'REOPENED',
        reopenReason: reason.trim(),
      },
      include: {
        closer: { select: { id: true, name: true } },
        closingJournalEntry: { select: { id: true, entryNumber: true } },
      },
    });

    logger.info(`Period reopened: ${id}`, { reason });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'PeriodClose',
      entityId: id,
      notes: `Reopened period. Reason: ${reason.trim()}`,
    });

    return updated;
  }

  /**
   * Get a P&L summary for a given month
   */
  async getMonthPnL(year: number, month: number) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd.setHours(23, 59, 59, 999);

    const lines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          date: { gte: periodStart, lte: periodEnd },
          referenceType: { not: 'PERIOD_CLOSE' },
        },
      },
      include: {
        accountHead: { select: { id: true, code: true, name: true, accountType: true } },
      },
    });

    const revenueMap: Map<string, { code: string; name: string; amount: number }> = new Map();
    const expenseMap: Map<string, { code: string; name: string; amount: number }> = new Map();

    for (const line of lines) {
      const debit = parseFloat(line.debitAmount.toString());
      const credit = parseFloat(line.creditAmount.toString());
      const { accountType, id, code, name } = line.accountHead;

      if (accountType === 'REVENUE') {
        const net = credit - debit;
        const existing = revenueMap.get(id);
        if (existing) {
          existing.amount += net;
        } else {
          revenueMap.set(id, { code, name, amount: net });
        }
      } else if (accountType === 'EXPENSE') {
        const net = debit - credit;
        const existing = expenseMap.get(id);
        if (existing) {
          existing.amount += net;
        } else {
          expenseMap.set(id, { code, name, amount: net });
        }
      }
    }

    const revenues = Array.from(revenueMap.values())
      .filter(r => Math.abs(r.amount) >= 0.01)
      .sort((a, b) => a.code.localeCompare(b.code));
    const expenses = Array.from(expenseMap.values())
      .filter(e => Math.abs(e.amount) >= 0.01)
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalRevenue = Math.round(revenues.reduce((s, r) => s + r.amount, 0) * 100) / 100;
    const totalExpenses = Math.round(expenses.reduce((s, e) => s + e.amount, 0) * 100) / 100;
    const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100;

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      revenues,
      expenses,
      totalRevenue,
      totalExpenses,
      netProfit,
    };
  }
}
