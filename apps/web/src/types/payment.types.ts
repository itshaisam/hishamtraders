export enum PaymentType {
  SUPPLIER = 'SUPPLIER',
  CLIENT = 'CLIENT',
}

export enum PaymentReferenceType {
  PO = 'PO',
  INVOICE = 'INVOICE',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  GENERAL = 'GENERAL',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
}

export interface Payment {
  id: string;
  supplierId?: string | null;
  paymentType: PaymentType;
  paymentReferenceType?: PaymentReferenceType | null;
  referenceId?: string | null;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string | null;
  recordedBy: string;
  createdAt: string;
  supplier?: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateSupplierPaymentDto {
  supplierId: string;
  paymentReferenceType?: PaymentReferenceType;
  referenceId?: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
  bankAccountId?: string;
}

export interface CreateClientPaymentDto {
  clientId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  date: string;
  notes?: string;
  bankAccountId?: string;
}

export interface PaymentFilters {
  supplierId?: string;
  method?: PaymentMethod;
  paymentReferenceType?: PaymentReferenceType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface POBalance {
  total: number;
  paid: number;
  outstanding: number;
}

export interface PaginatedPaymentsResponse {
  success: boolean;
  data: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaymentsResponse {
  success: boolean;
  data: Payment[];
}

export interface POBalanceResponse {
  success: boolean;
  data: POBalance;
}

// Story 3.8 - Unified Payment History types

export interface UnifiedPayment {
  id: string;
  date: string;
  type: PaymentType;
  partyName: string;
  partyId: string | null;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string;
  notes: string;
  recordedByName: string;
  allocations: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number | string;
  invoice: {
    id: string;
    invoiceNumber: string;
  };
}

export interface UnifiedPaymentFilters {
  paymentType?: 'CLIENT' | 'SUPPLIER' | 'ALL';
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UnifiedPaymentsResponse {
  success: boolean;
  data: UnifiedPayment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaymentDetail {
  id: string;
  supplierId: string | null;
  clientId: string | null;
  paymentType: PaymentType;
  paymentReferenceType: PaymentReferenceType | null;
  referenceId: string | null;
  amount: number | string;
  method: PaymentMethod;
  referenceNumber: string | null;
  date: string;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  supplier: { id: string; name: string } | null;
  client: { id: string; name: string; balance: number | string } | null;
  user: { id: string; name: string; email: string };
  allocations: {
    id: string;
    amount: number | string;
    invoice: {
      id: string;
      invoiceNumber: string;
      total: number | string;
      status: string;
    };
  }[];
  purchaseOrder: {
    id: string;
    poNumber: string;
    totalAmount: number | string;
    status: string;
  } | null;
}

export interface CashFlowReport {
  totalCashIn: number;
  totalCashOut: number;
  totalSupplierPayments: number;
  totalExpenses: number;
  netCashFlow: number;
  byPaymentMethod: {
    method: string;
    cashIn: number;
    cashOut: number;
    net: number;
  }[];
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CHEQUE]: 'Cheque',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.CLIENT]: 'Client',
  [PaymentType.SUPPLIER]: 'Supplier',
};
