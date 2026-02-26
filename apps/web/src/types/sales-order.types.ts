export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  PARTIALLY_INVOICED = 'PARTIALLY_INVOICED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  product: { id: string; name: string; sku: string; costPrice?: number; sellingPrice?: number };
  productVariantId: string | null;
  productVariant: { id: string; variantName: string; sku: string; sellingPrice?: number } | null;
  quantity: number;
  deliveredQuantity: number;
  invoicedQuantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface DeliveryNoteSummary {
  id: string;
  deliveryNoteNumber: string;
  status: string;
  deliveryDate: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  client: { id: string; name: string; creditLimit?: number; balance?: number };
  warehouseId: string;
  warehouse: { id: string; name: string };
  orderDate: string;
  expectedDeliveryDate: string | null;
  paymentType: 'CASH' | 'CREDIT';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: SalesOrderStatus;
  notes: string | null;
  cancelReason: string | null;
  createdBy: string;
  creator?: { id: string; name: string; email: string };
  items: SalesOrderItem[];
  deliveryNotes?: DeliveryNoteSummary[];
  invoices?: InvoiceSummary[];
  _count?: { items: number; deliveryNotes: number; invoices: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesOrderItemDto {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateSalesOrderDto {
  clientId: string;
  warehouseId: string;
  paymentType: 'CASH' | 'CREDIT';
  expectedDeliveryDate?: string;
  notes?: string;
  items: CreateSalesOrderItemDto[];
}

export interface SalesOrderFilters {
  search?: string;
  status?: SalesOrderStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface SalesOrderListResponse {
  data: SalesOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
