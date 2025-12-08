import { Product } from '@/features/products/types/product.types';

export type POStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export type POCostType = 'SHIPPING' | 'CUSTOMS' | 'TAX' | 'OTHER';

export interface POCost {
  id: string;
  poId: string;
  type: POCostType;
  amount: number;
  description?: string;
  createdAt: string | Date;
  createdBy?: string;
}

export interface LandedCostBreakdown {
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

export interface LandedCostResult {
  totalProductCost: number;
  totalAdditionalCosts: number;
  grandTotal: number;
  breakdown: LandedCostBreakdown[];
  costs: {
    id: string;
    type: string;
    amount: number;
    description?: string;
  }[];
}

export interface POItem {
  id: string;
  poId: string;
  productId: string;
  productVariantId?: string | null;
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
  // Import documentation fields (Story 2.3)
  containerNo?: string;
  shipDate?: string | Date | null;
  arrivalDate?: string | Date | null;
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
  costs?: POCost[];
}

export interface CreatePOItemRequest {
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitCost: number;
}

// Form state for PO items (includes UOM conversion fields)
export interface POItemFormData {
  product: Product;
  productVariantId?: string;       // Optional variant ID
  quantity: number;                // Base quantity (calculated or direct entry)
  unitCost: number;

  // UOM Conversion fields (UI only, not sent to API)
  useConversion: boolean;          // Toggle for conversion mode
  orderUomId?: string;             // UOM user wants to order in
  orderQuantity?: number;          // Quantity in order UOM
  conversionFactor?: number;       // How many base units per order UOM
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

// Story 2.3: Import documentation and costs
export interface AddPOCostRequest {
  type: POCostType;
  amount: number;
  description?: string;
}

export interface UpdateImportDetailsRequest {
  containerNo?: string;
  shipDate?: string | Date;
  arrivalDate?: string | Date;
}
