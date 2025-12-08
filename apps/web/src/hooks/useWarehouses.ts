import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { warehousesService } from '@/services/warehousesService';
import {
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  WarehouseFilters,
} from '@/types/warehouse.types';

/**
 * Hook to fetch all warehouses with optional filters
 */
export const useWarehouses = (filters?: WarehouseFilters) => {
  return useQuery({
    queryKey: ['warehouses', filters],
    queryFn: () => warehousesService.getAll(filters),
  });
};

/**
 * Hook to fetch a single warehouse by ID
 */
export const useWarehouse = (id: string) => {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: () => warehousesService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new warehouse
 */
export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseRequest) => warehousesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create warehouse');
    },
  });
};

/**
 * Hook to update an existing warehouse
 */
export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseRequest }) =>
      warehousesService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', variables.id] });
      toast.success('Warehouse updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update warehouse');
    },
  });
};

/**
 * Hook to delete a warehouse
 */
export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehousesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    },
  });
};

/**
 * Hook to get warehouses formatted for select dropdowns
 */
export const useWarehousesForSelect = () => {
  const { data, isLoading, error } = useWarehouses({ page: 1, limit: 100, status: 'ACTIVE' });

  return {
    options:
      data?.data?.map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
      })) || [],
    isLoading,
    error,
  };
};
