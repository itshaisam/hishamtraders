export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  name: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status?: SupplierStatus;
}

export interface UpdateSupplierRequest {
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status?: SupplierStatus;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SupplierDetailResponse {
  success: boolean;
  data: Supplier;
}

export interface SupplierFilters {
  search?: string;
  status?: SupplierStatus;
  page?: number;
  limit?: number;
}
