export enum PaymentType {
  SUPPLIER = 'SUPPLIER',
  CLIENT = 'CLIENT',
}

export enum PaymentReferenceType {
  PO = 'PO',
  INVOICE = 'INVOICE',
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
