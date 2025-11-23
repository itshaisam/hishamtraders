export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  name: string;
  country?: { id: string; code: string; name: string } | null;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerm?: { id: string; name: string } | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  countryId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTermId?: string;
  status?: SupplierStatus;
}

export interface UpdateSupplierRequest {
  countryId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTermId?: string;
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
