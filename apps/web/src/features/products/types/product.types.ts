export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  binLocation?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel?: number;
  binLocation?: string;
  status?: ProductStatus;
}

export interface UpdateProductRequest {
  brand?: string;
  category?: string;
  costPrice?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  binLocation?: string;
  status?: ProductStatus;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: Product;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}
