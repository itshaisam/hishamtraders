import { prisma, getTenantId } from '../../lib/prisma.js';
import { calculateBalanceChange } from '../../utils/balance-helper.js';
import logger from '../../lib/logger.js';

export class PettyCashService {
  /**
   * Get current petty cash balance from AccountHead 1102
   */
  async getBalance() {
    const account = await prisma.accountHead.findFirst({
      where: { code: '1102' },
      select: { id: true, code: true, name: true, currentBalance: true },
    });

    if (!account) {
      return { balance: 0, accountName: 'Petty Cash' };
    }

    return {
      balance: parseFloat(account.currentBalance.toString()),
      accountName: account.name,
    };
  }

  /**
   * Create petty cash advance: DR 1102 Petty Cash, CR source bank account
   */
  async createAdvance(amount: number, bankAccountId: string, userId: string) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Look up petty cash account
    const pettyCash = await prisma.accountHead.findFirst({
      where: { code: '1102' },
      select: { id: true, accountType: true },
    });
    if (!pettyCash) {
      throw new Error('Petty Cash account (1102) not found. Please seed accounts first.');
    }

    // Look up source bank account
    const bankAccount = await prisma.accountHead.findUnique({
      where: { id: bankAccountId },
      select: { id: true, code: true, name: true, accountType: true },
    });
    if (!bankAccount) {
      throw new Error('Source bank account not found');
    }
    if (!bankAccount.code.startsWith('11')) {
      throw new Error('Source must be a bank account (11xx)');
    }

    // Create journal entry in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Generate entry number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const prefix = `JE-${year}${month}${day}-`;

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

      // Create POSTED journal entry, then lines separately
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date,
          description: `Petty cash advance from ${bankAccount.name}`,
          status: 'POSTED',
          referenceType: 'PETTY_CASH',
          referenceId: 'advance',
          createdBy: userId,
          approvedBy: userId,
          tenantId: getTenantId(),
        },
      });

      await tx.journalEntryLine.createMany({
        data: [
          {
            journalEntryId: entry.id,
            accountHeadId: pettyCash.id,
            debitAmount: amount,
            creditAmount: 0,
            description: 'Petty cash advance',
            tenantId: getTenantId(),
          },
          {
            journalEntryId: entry.id,
            accountHeadId: bankAccount.id,
            debitAmount: 0,
            creditAmount: amount,
            description: `Transfer from ${bankAccount.name}`,
            tenantId: getTenantId(),
          },
        ],
      });

      // Update petty cash balance (ASSET: debit increases)
      const pettyCashChange = calculateBalanceChange('ASSET', amount, 0);
      await tx.accountHead.update({
        where: { id: pettyCash.id },
        data: { currentBalance: { increment: pettyCashChange } },
      });

      // Update bank balance (ASSET: credit decreases)
      const bankChange = calculateBalanceChange('ASSET', 0, amount);
      await tx.accountHead.update({
        where: { id: bankAccount.id },
        data: { currentBalance: { increment: bankChange } },
      });

      return entry;
    });

    logger.info('Petty cash advance created', {
      entryId: result.id,
      amount,
      bankAccountId,
    });

    return result;
  }

  /**
   * Get recent petty cash transactions (journal entry lines for account 1102)
   */
  async getTransactions(limit: number = 20) {
    const account = await prisma.accountHead.findFirst({
      where: { code: '1102' },
      select: { id: true },
    });

    if (!account) return [];

    const lines = await prisma.journalEntryLine.findMany({
      where: { accountHeadId: account.id },
      include: {
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            date: true,
            description: true,
            referenceType: true,
            referenceId: true,
          },
        },
      },
      orderBy: { journalEntry: { date: 'desc' } },
      take: limit,
    });

    return lines.map((l) => ({
      id: l.id,
      date: l.journalEntry.date,
      entryNumber: l.journalEntry.entryNumber,
      description: l.journalEntry.description,
      referenceType: l.journalEntry.referenceType,
      referenceId: l.journalEntry.referenceId,
      debit: parseFloat(l.debitAmount.toString()),
      credit: parseFloat(l.creditAmount.toString()),
    }));
  }
}
