import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { InventoryFilters } from '@/types/inventory.types';

/**
 * Hook to fetch all inventory with optional filters
 * Auto-refetches every 60 seconds for real-time inventory tracking
 */
export const useInventory = (filters?: InventoryFilters) => {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryService.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refetch every 1 minute
  });
};

/**
 * Hook to fetch inventory for a specific product across all warehouses
 */
export const useInventoryByProduct = (productId: string) => {
  return useQuery({
    queryKey: ['inventory', 'product', productId],
    queryFn: () => inventoryService.getByProduct(productId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch all inventory in a specific warehouse
 */
export const useInventoryByWarehouse = (warehouseId: string) => {
  return useQuery({
    queryKey: ['inventory', 'warehouse', warehouseId],
    queryFn: () => inventoryService.getByWarehouse(warehouseId),
    enabled: !!warehouseId,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch all low stock items
 * Auto-refetches every 2 minutes
 */
export const useLowStock = () => {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryService.getLowStock(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 120 * 1000, // Auto-refetch every 2 minutes
  });
};

/**
 * Hook to get available quantity for a product
 */
export const useAvailableQuantity = (
  productId: string,
  productVariantId?: string,
  warehouseId?: string
) => {
  return useQuery({
    queryKey: ['inventory', 'available', productId, productVariantId, warehouseId],
    queryFn: () => inventoryService.getAvailableQuantity(productId, productVariantId, warehouseId),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
};
