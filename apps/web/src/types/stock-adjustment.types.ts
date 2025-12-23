export type AdjustmentType = 'WASTAGE' | 'DAMAGE' | 'THEFT' | 'CORRECTION';
export type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StockAdjustment {
  id: string;
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes: string | null;
  status: AdjustmentStatus;
  createdBy: string;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  stockMovementId: string | null;
  product: {
    id: string;
    sku: string;
    name: string;
  };
  productVariant?: {
    id: string;
    sku: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  stockMovement?: any | null;
}

export interface CreateAdjustmentDto {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string | null;
}

export interface RejectAdjustmentDto {
  rejectionReason: string;
}

export interface AdjustmentFilters {
  productId?: string;
  warehouseId?: string;
  status?: AdjustmentStatus;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdjustmentResponse {
  success: boolean;
  data: StockAdjustment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleAdjustmentResponse {
  success: boolean;
  data: StockAdjustment;
  message?: string;
}
