export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface StockTransferItem {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string };
  batchNo: string | null;
  quantity: number;
  receivedQuantity: number | null;
  notes: string | null;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouse: { id: string; name: string };
  destinationWarehouseId: string;
  destinationWarehouse: { id: string; name: string };
  status: TransferStatus;
  requestedBy: string;
  requester: { id: string; name: string };
  approvedBy: string | null;
  approver: { id: string; name: string } | null;
  dispatchedBy: string | null;
  dispatcherName: string | null;
  completedBy: string | null;
  completerName: string | null;
  notes: string | null;
  items: StockTransferItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferDto {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  items: Array<{ productId: string; batchNo?: string; quantity: number; notes?: string }>;
}

export interface TransferFilters {
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  status?: TransferStatus;
  search?: string;
  page?: number;
  limit?: number;
}
