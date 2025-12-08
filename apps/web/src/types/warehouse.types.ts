export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateWarehouseRequest {
  name: string;
  location?: string;
  city?: string;
  status?: WarehouseStatus;
}

export interface UpdateWarehouseRequest {
  name?: string;
  location?: string;
  city?: string;
  status?: WarehouseStatus;
}

export interface WarehouseFilters {
  search?: string;
  status?: WarehouseStatus;
  page?: number;
  limit?: number;
}

export interface WarehousesResponse {
  success: boolean;
  message: string;
  data: Warehouse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WarehouseResponse {
  success: boolean;
  message: string;
  data: Warehouse;
}
