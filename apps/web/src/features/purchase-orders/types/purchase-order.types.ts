export type POStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface POItem {
  id: string;
  poId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  createdBy?: string;
  updatedBy?: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    costPrice: number;
    sellingPrice: number;
  };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: string | Date;
  expectedArrivalDate?: string | Date | null;
  status: POStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  updatedBy?: string;
  supplier?: {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  items: POItem[];
}

export interface CreatePOItemRequest {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  orderDate: string | Date;
  expectedArrivalDate?: string | Date;
  items: CreatePOItemRequest[];
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  expectedArrivalDate?: string | Date;
  status?: POStatus;
  notes?: string;
}

export interface UpdatePOStatusRequest {
  status: POStatus;
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: POStatus;
  supplierId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseOrderResponse {
  success: boolean;
  data: PurchaseOrder;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PurchaseOrderListResponse {
  success: boolean;
  data: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PurchaseOrderStatistics {
  totalPOs: number;
  pendingPOs: number;
  totalValue: number;
}
