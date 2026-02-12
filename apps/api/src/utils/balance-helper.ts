import { AccountType } from '@prisma/client';

/**
 * Central balance logic for double-entry accounting.
 *
 * ASSET & EXPENSE accounts are "debit-normal":
 *   balance += debit - credit
 *
 * LIABILITY, EQUITY & REVENUE accounts are "credit-normal":
 *   balance += credit - debit
 */
export function calculateBalanceChange(
  accountType: AccountType,
  debitAmount: number,
  creditAmount: number
): number {
  const isDebitNormal = accountType === 'ASSET' || accountType === 'EXPENSE';
  return isDebitNormal
    ? debitAmount - creditAmount
    : creditAmount - debitAmount;
}

/**
 * Check if an account type has a debit-normal balance.
 */
export function isDebitNormalAccount(accountType: AccountType): boolean {
  return accountType === 'ASSET' || accountType === 'EXPENSE';
}
