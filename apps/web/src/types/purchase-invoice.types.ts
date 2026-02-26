export enum PurchaseInvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseInvoiceItem {
  id: string;
  purchaseInvoiceId: string;
  productId: string;
  product: { id: string; name: string; sku: string };
  productVariantId: string | null;
  productVariant: { id: string; variantName: string; sku: string } | null;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  internalNumber: string;
  supplierId: string;
  supplier: { id: string; name: string };
  poId: string | null;
  purchaseOrder?: { id: string; poNumber: string; status?: string } | null;
  grnId: string | null;
  goodsReceiveNote?: { id: string; grnNumber: string; status?: string } | null;
  invoiceDate: string;
  dueDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  notes: string | null;
  createdBy: string;
  creator?: { id: string; name: string; email: string };
  items: PurchaseInvoiceItem[];
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseInvoiceItemDto {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInvoiceDto {
  invoiceNumber: string;
  supplierId: string;
  poId?: string;
  grnId?: string;
  invoiceDate: string;
  dueDate?: string;
  taxRate: number;
  notes?: string;
  items: CreatePurchaseInvoiceItemDto[];
}

export interface PurchaseInvoiceFilters {
  search?: string;
  status?: PurchaseInvoiceStatus;
  supplierId?: string;
  poId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseInvoiceListResponse {
  data: PurchaseInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ThreeWayMatchVariance {
  productId: string;
  productName: string;
  productSku: string;
  variantName: string | null;
  poQty: number;
  grnQty: number;
  piQty: number;
  poUnitCost: number;
  piUnitCost: number;
  qtyMatch: boolean;
  costMatch: boolean;
}

export interface ThreeWayMatchResponse {
  poItems: any[];
  grnItems: any[];
  piItems: any[];
  variances: ThreeWayMatchVariance[];
}
