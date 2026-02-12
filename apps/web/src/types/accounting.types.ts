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
