import { AccountType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface BalanceSheetRow {
  accountId: string;
  code: string;
  name: string;
  accountType: AccountType;
  balance: number;
}

export interface BalanceSheetSection {
  type: AccountType;
  label: string;
  accounts: BalanceSheetRow[];
  total: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  retainedEarnings: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export class BalanceSheetService {
  async getBalanceSheet(asOfDate: Date): Promise<BalanceSheetReport> {
    // Get all active accounts
    const accounts = await prisma.accountHead.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    });

    // Get all posted journal lines up to asOfDate
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

    // Aggregate per account
    const lineMap: Record<string, { debits: number; credits: number }> = {};
    for (const line of lines) {
      if (!lineMap[line.accountHeadId]) {
        lineMap[line.accountHeadId] = { debits: 0, credits: 0 };
      }
      lineMap[line.accountHeadId].debits += parseFloat(line.debitAmount.toString());
      lineMap[line.accountHeadId].credits += parseFloat(line.creditAmount.toString());
    }

    // Calculate balance for each account
    const accountBalances: BalanceSheetRow[] = accounts.map((account) => {
      const agg = lineMap[account.id] || { debits: 0, credits: 0 };
      const opening = parseFloat(account.openingBalance.toString());
      const isDebitNormal =
        account.accountType === 'ASSET' || account.accountType === 'EXPENSE';
      const net = isDebitNormal
        ? agg.debits - agg.credits
        : agg.credits - agg.debits;

      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        balance: Math.round((opening + net) * 100) / 100,
      };
    });

    // Group by type
    const byType = (type: AccountType) =>
      accountBalances.filter((a) => a.accountType === type && a.balance !== 0);

    const assetAccounts = byType('ASSET');
    const liabilityAccounts = byType('LIABILITY');
    const equityAccounts = byType('EQUITY');
    const revenueAccounts = byType('REVENUE');
    const expenseAccounts = byType('EXPENSE');

    const assetsTotal = assetAccounts.reduce((s, a) => s + a.balance, 0);
    const liabilitiesTotal = liabilityAccounts.reduce((s, a) => s + a.balance, 0);
    const equityTotal = equityAccounts.reduce((s, a) => s + a.balance, 0);
    const revenueTotal = revenueAccounts.reduce((s, a) => s + a.balance, 0);
    const expenseTotal = expenseAccounts.reduce((s, a) => s + a.balance, 0);

    // Retained Earnings = Revenue - Expenses (net income added to equity)
    const retainedEarnings = Math.round((revenueTotal - expenseTotal) * 100) / 100;
    const totalLiabilitiesAndEquity = Math.round((liabilitiesTotal + equityTotal + retainedEarnings) * 100) / 100;

    return {
      asOfDate: asOfDate.toISOString().slice(0, 10),
      assets: {
        type: 'ASSET',
        label: 'Assets',
        accounts: assetAccounts,
        total: Math.round(assetsTotal * 100) / 100,
      },
      liabilities: {
        type: 'LIABILITY',
        label: 'Liabilities',
        accounts: liabilityAccounts,
        total: Math.round(liabilitiesTotal * 100) / 100,
      },
      equity: {
        type: 'EQUITY',
        label: 'Equity',
        accounts: equityAccounts,
        total: Math.round(equityTotal * 100) / 100,
      },
      retainedEarnings,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(Math.round(assetsTotal * 100) / 100 - totalLiabilitiesAndEquity) < 0.01,
    };
  }
}
