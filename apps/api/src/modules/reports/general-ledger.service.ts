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
    openingBalance = Math.round(openingBalance * 100) / 100;

    // Get journal lines within the date range
    const journalLines = await prisma.journalEntryLine.findMany({
      where: {
        accountHeadId,
        journalEntry: {
          status: 'POSTED',
          date: { gte: dateFrom, lte: dateTo },
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
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    const totalDebits = Math.round(entries.reduce((s, e) => s + e.debitAmount, 0) * 100) / 100;
    const totalCredits = Math.round(entries.reduce((s, e) => s + e.creditAmount, 0) * 100) / 100;

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
      closingBalance: Math.round(runningBalance * 100) / 100,
      totalDebits,
      totalCredits,
    };
  }
}
