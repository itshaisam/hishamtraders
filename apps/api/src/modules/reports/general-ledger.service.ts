import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';

export interface GeneralLedgerEntry {
  date: string;
  entryNumber: string;
  journalEntryId: string;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
}

export interface GeneralLedgerReport {
  account: {
    id: string;
    code: string;
    name: string;
    accountType: string;
  };
  dateFrom: string;
  dateTo: string;
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
}

export class GeneralLedgerService {
  async getGeneralLedger(
    accountHeadId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<GeneralLedgerReport> {
    // Get the account
    const account = await prisma.accountHead.findUnique({
      where: { id: accountHeadId },
      select: { id: true, code: true, name: true, accountType: true, openingBalance: true },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const isDebitNormal =
      account.accountType === 'ASSET' || account.accountType === 'EXPENSE';

    // Set dateTo to end of day so we include all entries on that date
    const endOfDateTo = new Date(dateTo);
    endOfDateTo.setHours(23, 59, 59, 999);

    // Calculate opening balance: account's opening balance + all posted lines BEFORE dateFrom
    const priorLines = await prisma.journalEntryLine.findMany({
      where: {
        accountHeadId,
        journalEntry: {
          status: 'POSTED',
          date: { lt: dateFrom },
        },
      },
      select: { debitAmount: true, creditAmount: true },
    });

    let openingBalance = parseFloat(account.openingBalance.toString());
    for (const line of priorLines) {
      const debit = parseFloat(line.debitAmount.toString());
      const credit = parseFloat(line.creditAmount.toString());
      openingBalance += isDebitNormal ? debit - credit : credit - debit;
    }
    openingBalance = Math.round(openingBalance * 10000) / 10000;

    // Get journal lines within the date range
    const journalLines = await prisma.journalEntryLine.findMany({
      where: {
        accountHeadId,
        journalEntry: {
          status: 'POSTED',
          date: { gte: dateFrom, lte: endOfDateTo },
        },
      },
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
      orderBy: { journalEntry: { date: 'asc' } },
    });

    let runningBalance = openingBalance;
    const entries: GeneralLedgerEntry[] = journalLines.map((line) => {
      const debit = parseFloat(line.debitAmount.toString());
      const credit = parseFloat(line.creditAmount.toString());
      runningBalance += isDebitNormal ? debit - credit : credit - debit;

      return {
        date: line.journalEntry.date.toISOString().slice(0, 10),
        entryNumber: line.journalEntry.entryNumber,
        journalEntryId: line.journalEntry.id,
        description: line.journalEntry.description,
        referenceType: line.journalEntry.referenceType,
        referenceId: line.journalEntry.referenceId,
        debitAmount: debit,
        creditAmount: credit,
        runningBalance: Math.round(runningBalance * 10000) / 10000,
      };
    });

    const totalDebits = Math.round(entries.reduce((s, e) => s + e.debitAmount, 0) * 10000) / 10000;
    const totalCredits = Math.round(entries.reduce((s, e) => s + e.creditAmount, 0) * 10000) / 10000;

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
      },
      dateFrom: dateFrom.toISOString().slice(0, 10),
      dateTo: dateTo.toISOString().slice(0, 10),
      openingBalance,
      entries,
      closingBalance: Math.round(runningBalance * 10000) / 10000,
      totalDebits,
      totalCredits,
    };
  }
}
