export type GRNStatus = 'COMPLETED' | 'CANCELLED';
export type POCostType = 'SHIPPING' | 'CUSTOMS' | 'TAX' | 'OTHER';

export interface GRNCost {
  id: string;
  grnId: string;
  type: POCostType;
  amount: number;
  description?: string | null;
  createdAt: string | Date;
  createdBy?: string | null;
}

export interface AddGRNCostRequest {
  type: POCostType;
  amount: number;
  description?: string;
}

export interface GRNLandedCostBreakdown {
  productId: string;
  productName: string;
  productSku: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  productCost: number;
  productRatio: number;
  allocatedAdditionalCost: number;
  totalLandedCost: number;
  landedCostPerUnit: number;
}

export interface GRNLandedCostResult {
  totalProductCost: number;
  totalAdditionalCosts: number;
  grandTotal: number;
  breakdown: GRNLandedCostBreakdown[];
  costs: {
    id: string;
    type: string;
    amount: number;
    description?: string;
    source: 'PO' | 'GRN';
    grnNumber?: string;
  }[];
}

export interface GoodsReceiveNoteItem {
  id: string;
  grnId: string;
  poItemId: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  binLocation?: string | null;
  batchNo?: string | null;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
    id: string;
    variantName: string;
    sku: string;
  } | null;
  poItem?: {
    id: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
  };
}

export interface GoodsReceiveNote {
  id: string;
  grnNumber: string;
  poId: string;
  warehouseId: string;
  receivedDate: string | Date;
  status: GRNStatus;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: string;
  purchaseOrder?: {
    id: string;
    poNumber: string;
    totalAmount: number;
    taxRate: number;
    taxAmount: number;
    supplier?: {
      id: string;
      name: string;
    };
    items?: Array<{
      id: string;
      productId: string;
      productVariantId?: string | null;
      quantity: number;
      receivedQuantity: number;
      unitCost: number;
      totalCost: number;
      product?: { id: string; name: string; sku: string };
      productVariant?: { id: string; variantName: string; sku: string } | null;
    }>;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
  items: GoodsReceiveNoteItem[];
  costs?: GRNCost[];
}

export interface GRNFilters {
  search?: string;
  poId?: string;
  warehouseId?: string;
  supplierId?: string;
  status?: GRNStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateGRNItemRequest {
  poItemId: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  binLocation?: string | null;
  batchNo?: string | null;
}

export interface CreateGRNRequest {
  poId: string;
  warehouseId: string;
  receivedDate?: string | Date;
  notes?: string | null;
  items: CreateGRNItemRequest[];
}

export interface GRNListResponse {
  success: boolean;
  data: GoodsReceiveNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GRNDetailResponse {
  success: boolean;
  data: GoodsReceiveNote;
}
