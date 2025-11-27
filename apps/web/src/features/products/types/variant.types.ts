export type VariantStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantName: string;
  attributes: Record<string, string>;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  binLocation?: string | null;
  status: VariantStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface CreateVariantDto {
  productId: string;
  sku?: string;
  variantName: string;
  attributes: Record<string, string>;
  costPrice: number | string;
  sellingPrice: number | string;
  reorderLevel?: number;
  binLocation?: string;
  status?: VariantStatus;
}

export interface UpdateVariantDto {
  variantName?: string;
  attributes?: Record<string, string>;
  costPrice?: number | string;
  sellingPrice?: number | string;
  reorderLevel?: number;
  binLocation?: string;
  status?: VariantStatus;
}

export interface VariantFilterParams {
  productId?: string;
  status?: VariantStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VariantResponse {
  success: boolean;
  data: ProductVariant;
  message?: string;
}

export interface VariantsListResponse {
  success: boolean;
  data: ProductVariant[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
