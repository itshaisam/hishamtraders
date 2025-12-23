import axios from 'axios';
import {
  StockMovementFilters,
  PaginatedMovementsResponse,
  MovementsResponse,
} from '../types/stock-movement.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const stockMovementService = {
  /**
   * Get all stock movements with filters and pagination
   */
  getAll: async (filters: StockMovementFilters): Promise<PaginatedMovementsResponse> => {
    const params: any = {};

    if (filters.productId) {
      params.productId = filters.productId;
    }

    if (filters.productVariantId) {
      params.productVariantId = filters.productVariantId;
    }

    if (filters.warehouseId) {
      params.warehouseId = filters.warehouseId;
    }

    if (filters.movementType) {
      params.movementType = filters.movementType;
    }

    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      params.dateTo = filters.dateTo;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.pageSize) {
      params.pageSize = filters.pageSize;
    }

    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  /**
   * Get movements for a specific product
   */
  getByProduct: async (
    productId: string,
    productVariantId?: string
  ): Promise<MovementsResponse> => {
    const params: any = {};
    if (productVariantId) {
      params.productVariantId = productVariantId;
    }

    const response = await api.get(`/inventory/movements/product/${productId}`, { params });
    return response.data;
  },

  /**
   * Get movements for a specific warehouse
   */
  getByWarehouse: async (warehouseId: string): Promise<MovementsResponse> => {
    const response = await api.get(`/inventory/movements/warehouse/${warehouseId}`);
    return response.data;
  },

  /**
   * Get movements for a specific product in a specific warehouse
   */
  getByProductAndWarehouse: async (
    productId: string,
    warehouseId: string,
    productVariantId?: string
  ): Promise<MovementsResponse> => {
    const params: any = {};
    if (productVariantId) {
      params.productVariantId = productVariantId;
    }

    const response = await api.get(
      `/inventory/movements/product/${productId}/warehouse/${warehouseId}`,
      { params }
    );
    return response.data;
  },
};
