export enum MovementType {
  RECEIPT = 'RECEIPT',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export enum ReferenceType {
  PO = 'PO',
  INVOICE = 'INVOICE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

export interface StockMovement {
  id: string;
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  movementDate: string;
  userId: string;
  notes: string | null;
  createdAt: string;
}

export interface MovementWithBalance {
  id: string;
  movementDate: string;
  movementType: MovementType;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  quantityIn: number;
  quantityOut: number;
  runningBalance: number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
    id: string;
    variantName: string;
    sku: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export interface StockMovementFilters {
  productId?: string;
  productVariantId?: string;
  warehouseId?: string;
  movementType?: MovementType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedMovementsResponse {
  success: boolean;
  data: MovementWithBalance[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface MovementsResponse {
  success: boolean;
  data: MovementWithBalance[];
}
