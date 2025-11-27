export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  uom?: { id: string; name: string; abbreviation: string } | null;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  binLocation?: string;
  status: ProductStatus;
  hasVariants?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  brandId?: string;
  categoryId?: string;
  uomId?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel?: number;
  binLocation?: string;
  status?: ProductStatus;
}

export interface UpdateProductRequest {
  brandId?: string;
  categoryId?: string;
  uomId?: string;
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
