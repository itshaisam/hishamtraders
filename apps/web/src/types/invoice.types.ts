export enum InvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED', // Story 3.4: Invoice voiding
}

export enum InvoicePaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  productVariantId?: string | null;
  batchNo?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product: {
    id: string;
    sku: string;
    name: string;
  };
  productVariant?: {
    id: string;
    sku: string;
    variantName: string;
  } | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  warehouseId: string;
  invoiceDate: string;
  dueDate: string;
  paymentType: InvoicePaymentType;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string | null;
  // Story 3.4: Void tracking
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    city?: string | null;
  };
  warehouse: {
    id: string;
    name: string;
  };
  items: InvoiceItem[];
  voider?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateInvoiceItemDto {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateInvoiceDto {
  clientId: string;
  warehouseId: string;
  invoiceDate: string;
  paymentType: InvoicePaymentType;
  items: CreateInvoiceItemDto[];
  notes?: string;
  adminOverride?: boolean;
  overrideReason?: string;
}

export interface InvoiceFilters {
  clientId?: string;
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
