export enum GatePassStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum GatePassPurpose {
  SALE = 'SALE',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
  OTHER = 'OTHER',
}

export enum GatePassMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export interface GatePassItem {
  id: string;
  gatePassId: string;
  productId: string;
  batchNo: string | null;
  binLocation: string | null;
  quantity: number;
  description: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface GatePass {
  id: string;
  gatePassNumber: string;
  warehouseId: string;
  date: string;
  purpose: GatePassPurpose;
  referenceType: string | null;
  referenceId: string | null;
  status: GatePassStatus;
  issuedBy: string;
  approvedBy: string | null;
  dispatchedBy: string | null;
  completedBy: string | null;
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse: {
    id: string;
    name: string;
    gatePassMode?: GatePassMode;
  };
  issuer: {
    id: string;
    name: string;
  };
  approver: {
    id: string;
    name: string;
  } | null;
  dispatcherName?: string | null;
  completerName?: string | null;
  referenceNumber?: string | null;
  items: GatePassItem[];
}

export interface CreateGatePassDto {
  warehouseId: string;
  date: string;
  purpose: GatePassPurpose;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  items: {
    productId: string;
    batchNo?: string;
    binLocation?: string;
    quantity: number;
    description?: string;
  }[];
}

export interface GatePassFilters {
  warehouseId?: string;
  status?: GatePassStatus;
  purpose?: GatePassPurpose;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GatePassListResponse {
  success: boolean;
  data: GatePass[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
