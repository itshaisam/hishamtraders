export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: string;
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  quantity: number;
  batchNo: string | null;
  binLocation: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    sku: string;
    name: string;
    reorderLevel: number;
  };
  productVariant?: {
    id: string;
    sku: string;
    variantName: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
    city: string | null;
  };
  status: StockStatus;
}

export interface InventoryFilters {
  productId?: string;
  warehouseId?: string;
  status?: StockStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InventoryResponse {
  success: boolean;
  data: InventoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LowStockResponse {
  success: boolean;
  data: InventoryItem[];
  count: number;
}

export interface AvailableQuantityResponse {
  success: boolean;
  data: {
    productId: string;
    productVariantId: string | null;
    warehouseId: string | null;
    quantity: number;
  };
}

export interface BatchDetail {
  batchNo: string;
  quantity: number;
  binLocation: string | null;
  createdAt: string;
}

export interface GroupedInventoryItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    reorderLevel: number;
  };
  productVariant: {
    id: string;
    sku: string;
    variantName: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
    city: string | null;
  };
  totalQuantity: number;
  status: StockStatus;
  batches: BatchDetail[];
  lastUpdated: string;
}

export interface GroupedInventoryResponse {
  success: boolean;
  data: GroupedInventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
