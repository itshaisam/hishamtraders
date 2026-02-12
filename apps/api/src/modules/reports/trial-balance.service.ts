import { PrismaClient, AccountType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  accountType: AccountType;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  rows: TrialBalanceRow[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    debitBalanceTotal: number;
    creditBalanceTotal: number;
  };
  isBalanced: boolean;
}

export class TrialBalanceService {
  async getTrialBalance(asOfDate: Date): Promise<TrialBalanceReport> {
    // Get all active accounts
    const accounts = await prisma.accountHead.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    });

    // Get posted journal entry lines up to asOfDate
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          date: { lte: asOfDate },
        },
      },
      select: {
        accountHeadId: true,
        debitAmount: true,
        creditAmount: true,
      },
    });

    // Aggregate debits/credits per account
    const lineMap: Record<string, { totalDebits: number; totalCredits: number }> = {};
    for (const line of lines) {
      if (!lineMap[line.accountHeadId]) {
        lineMap[line.accountHeadId] = { totalDebits: 0, totalCredits: 0 };
      }
      lineMap[line.accountHeadId].totalDebits += parseFloat(line.debitAmount.toString());
      lineMap[line.accountHeadId].totalCredits += parseFloat(line.creditAmount.toString());
    }

    const rows: TrialBalanceRow[] = [];

    for (const account of accounts) {
      const agg = lineMap[account.id] || { totalDebits: 0, totalCredits: 0 };
      const opening = parseFloat(account.openingBalance.toString());

      const isDebitNormal =
        account.accountType === 'ASSET' || account.accountType === 'EXPENSE';

      // closingBalance = opening + net movement
      // For debit-normal: net = debits - credits
      // For credit-normal: net = credits - debits
      const netMovement = isDebitNormal
        ? agg.totalDebits - agg.totalCredits
        : agg.totalCredits - agg.totalDebits;
      const closingBalance = opening + netMovement;

      // Skip accounts with no activity and zero balance
      if (
        agg.totalDebits === 0 &&
        agg.totalCredits === 0 &&
        opening === 0
      ) {
        continue;
      }

      // Trial balance shows: debit column if positive, credit column if negative (for the closing balance)
      const debitBalance = closingBalance > 0 && isDebitNormal ? closingBalance : (!isDebitNormal && closingBalance < 0 ? Math.abs(closingBalance) : 0);
      const creditBalance = closingBalance > 0 && !isDebitNormal ? closingBalance : (isDebitNormal && closingBalance < 0 ? Math.abs(closingBalance) : 0);

      rows.push({
        accountId: account.id,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        openingBalance: opening,
        totalDebits: Math.round(agg.totalDebits * 100) / 100,
        totalCredits: Math.round(agg.totalCredits * 100) / 100,
        closingBalance: Math.round(closingBalance * 100) / 100,
        debitBalance: Math.round(debitBalance * 100) / 100,
        creditBalance: Math.round(creditBalance * 100) / 100,
      });
    }

    const totals = {
      totalDebits: Math.round(rows.reduce((s, r) => s + r.totalDebits, 0) * 100) / 100,
      totalCredits: Math.round(rows.reduce((s, r) => s + r.totalCredits, 0) * 100) / 100,
      debitBalanceTotal: Math.round(rows.reduce((s, r) => s + r.debitBalance, 0) * 100) / 100,
      creditBalanceTotal: Math.round(rows.reduce((s, r) => s + r.creditBalance, 0) * 100) / 100,
    };

    return {
      asOfDate: asOfDate.toISOString().slice(0, 10),
      rows,
      totals,
      isBalanced: Math.abs(totals.debitBalanceTotal - totals.creditBalanceTotal) < 0.01,
    };
  }
}
