export enum CreditNoteStatus {
  OPEN = 'OPEN',
  APPLIED = 'APPLIED',
  VOIDED = 'VOIDED',
}

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  invoiceItemId: string;
  productId: string;
  productVariantId?: string | null;
  batchNo?: string | null;
  quantityReturned: number;
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
  invoiceItem?: {
    id: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  };
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  clientId: string;
  reason: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: CreditNoteStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate?: string;
    total?: number;
    status?: string;
    warehouse?: {
      id: string;
      name: string;
    };
  };
  client: {
    id: string;
    name: string;
    city?: string | null;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  items: CreditNoteItem[];
}

export interface CreateCreditNoteItemDto {
  invoiceItemId: string;
  quantityReturned: number;
}

export interface CreateCreditNoteDto {
  invoiceId: string;
  reason: string;
  items: CreateCreditNoteItemDto[];
}

export interface CreditNoteFilters {
  clientId?: string;
  invoiceId?: string;
  status?: CreditNoteStatus;
  page?: number;
  limit?: number;
}

export interface CreditNoteListResponse {
  data: CreditNote[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
