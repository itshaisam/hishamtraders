import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockAdjustmentService } from '@/services/stockAdjustmentService';
import {
  AdjustmentFilters,
  CreateAdjustmentDto,
  RejectAdjustmentDto,
} from '@/types/stock-adjustment.types';

/**
 * Hook to fetch all adjustments with optional filters
 */
export const useStockAdjustments = (filters?: AdjustmentFilters) => {
  return useQuery({
    queryKey: ['stock-adjustments', filters],
    queryFn: () => stockAdjustmentService.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to fetch pending adjustments (for admin approval queue)
 */
export const usePendingAdjustments = (filters?: {
  warehouseId?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['stock-adjustments', 'pending', filters],
    queryFn: () => stockAdjustmentService.getPending(filters),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Auto-refetch every 1 minute for approval queue
  });
};

/**
 * Hook to fetch single adjustment by ID
 */
export const useStockAdjustment = (id: string) => {
  return useQuery({
    queryKey: ['stock-adjustments', id],
    queryFn: () => stockAdjustmentService.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to create a new stock adjustment
 */
export const useCreateAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdjustmentDto) => stockAdjustmentService.create(data),
    onSuccess: () => {
      // Invalidate adjustments list to refetch
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
    },
  });
};

/**
 * Hook to approve a pending adjustment
 */
export const useApproveAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stockAdjustmentService.approve(id),
    onSuccess: () => {
      // Invalidate both adjustments and inventory to reflect updated stock
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

/**
 * Hook to reject a pending adjustment
 */
export const useRejectAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectAdjustmentDto }) =>
      stockAdjustmentService.reject(id, data),
    onSuccess: () => {
      // Invalidate adjustments list to refetch
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
    },
  });
};
