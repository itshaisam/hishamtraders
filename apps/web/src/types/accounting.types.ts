export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface AccountHead {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  parentId: string | null;
  openingBalance: number;
  currentBalance: number;
  status: AccountStatus;
  isSystemAccount: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: { id: string; code: string; name: string } | null;
  children?: AccountHead[];
  _count?: { journalLines: number };
}

export interface CreateAccountHeadDto {
  code: string;
  name: string;
  accountType: AccountType;
  parentId?: string | null;
  openingBalance?: number;
  status?: AccountStatus;
  isSystemAccount?: boolean;
  description?: string | null;
}

export interface UpdateAccountHeadDto {
  name?: string;
  parentId?: string | null;
  openingBalance?: number;
  status?: AccountStatus;
  description?: string | null;
}

export interface AccountHeadFilters {
  accountType?: AccountType;
  status?: AccountStatus;
  parentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Journal Entry types
export type JournalEntryStatus = 'DRAFT' | 'POSTED';

export interface JournalEntryLine {
  id: string;
  accountHeadId: string;
  debitAmount: number;
  creditAmount: number;
  description: string | null;
  accountHead: {
    id: string;
    code: string;
    name: string;
    accountType: AccountType;
  };
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: JournalEntryLine[];
  creator: { id: string; name: string; email: string };
  approver: { id: string; name: string; email: string } | null;
}

export interface CreateJournalEntryLineDto {
  accountHeadId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string | null;
}

export interface CreateJournalEntryDto {
  date: string;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  lines: CreateJournalEntryLineDto[];
}

export interface UpdateJournalEntryDto {
  date?: string;
  description?: string;
  referenceType?: string | null;
  referenceId?: string | null;
  lines?: CreateJournalEntryLineDto[];
}

export interface JournalEntryFilters {
  status?: JournalEntryStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Bank Account types (Story 5.7)
export interface BankAccount {
  id: string;
  code: string;
  name: string;
  currentBalance: number;
  isSystemAccount: boolean;
  parentId: string | null;
}

// Petty Cash types (Story 5.9)
export interface PettyCashBalance {
  balance: number;
  accountName: string;
}

export interface PettyCashTransaction {
  id: string;
  date: string;
  entryNumber: string;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  debit: number;
  credit: number;
}
