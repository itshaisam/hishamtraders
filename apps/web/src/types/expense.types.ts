export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SALARIES = 'SALARIES',
  SUPPLIES = 'SUPPLIES',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  TRANSPORT = 'TRANSPORT',
  MISC = 'MISC',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateExpenseDto {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date | string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
}

export interface UpdateExpenseDto {
  category?: ExpenseCategory;
  amount?: number;
  description?: string;
  date?: Date | string;
  paymentMethod?: PaymentMethod;
  receiptUrl?: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
  }>;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: 'Rent',
  [ExpenseCategory.UTILITIES]: 'Utilities',
  [ExpenseCategory.SALARIES]: 'Salaries',
  [ExpenseCategory.SUPPLIES]: 'Supplies',
  [ExpenseCategory.MAINTENANCE]: 'Maintenance',
  [ExpenseCategory.MARKETING]: 'Marketing',
  [ExpenseCategory.TRANSPORT]: 'Transport',
  [ExpenseCategory.MISC]: 'Miscellaneous',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CHEQUE]: 'Cheque',
};
