import { useQuery } from '@tanstack/react-query';
import { stockMovementService } from '../services/stockMovementService';
import { StockMovementFilters } from '../types/stock-movement.types';

/**
 * Hook to fetch all stock movements with filters and pagination
 */
export function useStockMovements(filters: StockMovementFilters) {
  return useQuery({
    queryKey: ['stockMovements', filters],
    queryFn: () => stockMovementService.getAll(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch movements for a specific product
 */
export function useProductMovements(productId: string, productVariantId?: string) {
  return useQuery({
    queryKey: ['productMovements', productId, productVariantId],
    queryFn: () => stockMovementService.getByProduct(productId, productVariantId),
    enabled: !!productId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch movements for a specific warehouse
 */
export function useWarehouseMovements(warehouseId: string) {
  return useQuery({
    queryKey: ['warehouseMovements', warehouseId],
    queryFn: () => stockMovementService.getByWarehouse(warehouseId),
    enabled: !!warehouseId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch movements for a specific product in a specific warehouse
 */
export function useProductWarehouseMovements(
  productId: string,
  warehouseId: string,
  productVariantId?: string
) {
  return useQuery({
    queryKey: ['productWarehouseMovements', productId, warehouseId, productVariantId],
    queryFn: () =>
      stockMovementService.getByProductAndWarehouse(productId, warehouseId, productVariantId),
    enabled: !!productId && !!warehouseId,
    staleTime: 30000,
  });
}
