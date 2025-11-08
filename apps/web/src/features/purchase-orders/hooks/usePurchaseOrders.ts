import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { purchaseOrdersService } from '../services/purchaseOrdersService';
import {
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  UpdatePOStatusRequest,
  PurchaseOrderFilters,
  POStatus,
} from '../types/purchase-order.types';

export const usePurchaseOrders = (filters?: PurchaseOrderFilters) => {
  return useQuery({
    queryKey: ['purchaseOrders', filters],
    queryFn: () => purchaseOrdersService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => purchaseOrdersService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) =>
      purchaseOrdersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success('Purchase order created successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to create purchase order'
      );
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrderRequest }) =>
      purchaseOrdersService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({
        queryKey: ['purchaseOrder', variables.id],
      });
      toast.success('Purchase order updated successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update purchase order'
      );
    },
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      statusData,
    }: {
      id: string;
      statusData: UpdatePOStatusRequest;
    }) => purchaseOrdersService.updateStatus(id, statusData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({
        queryKey: ['purchaseOrder', variables.id],
      });
      toast.success('Purchase order status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Failed to update purchase order status'
      );
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success('Purchase order deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to delete purchase order'
      );
    },
  });
};

export const usePurchaseOrderStatistics = () => {
  return useQuery({
    queryKey: ['purchaseOrderStatistics'],
    queryFn: () => purchaseOrdersService.getStatistics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
