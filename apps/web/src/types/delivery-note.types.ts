export enum DeliveryNoteStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryNoteItem {
  id: string;
  deliveryNoteId: string;
  productId: string;
  product: { id: string; name: string; sku: string };
  productVariantId: string | null;
  productVariant: { id: string; variantName: string; sku: string } | null;
  batchNo: string | null;
  quantity: number;
  salesOrderItemId: string | null;
  salesOrderItem?: { id: string; quantity: number; deliveredQuantity: number } | null;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  salesOrderId: string | null;
  salesOrder?: { id: string; orderNumber: string; status: string } | null;
  clientId: string;
  client: { id: string; name: string };
  warehouseId: string;
  warehouse: { id: string; name: string };
  deliveryDate: string;
  status: DeliveryNoteStatus;
  deliveryAddress: string | null;
  driverName: string | null;
  vehicleNo: string | null;
  notes: string | null;
  cancelReason: string | null;
  createdBy: string;
  creator?: { id: string; name: string; email: string };
  dispatcher?: { id: string; name: string } | null;
  completer?: { id: string; name: string } | null;
  items: DeliveryNoteItem[];
  invoices?: Array<{ id: string; invoiceNumber: string; status: string; total: number }>;
  _count?: { items: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryNoteItemDto {
  salesOrderItemId?: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
}

export interface CreateDeliveryNoteDto {
  salesOrderId?: string;
  clientId: string;
  warehouseId: string;
  deliveryAddress?: string;
  driverName?: string;
  vehicleNo?: string;
  notes?: string;
  items: CreateDeliveryNoteItemDto[];
}

export interface DeliveryNoteFilters {
  search?: string;
  status?: DeliveryNoteStatus;
  clientId?: string;
  salesOrderId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface DeliveryNoteListResponse {
  data: DeliveryNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
