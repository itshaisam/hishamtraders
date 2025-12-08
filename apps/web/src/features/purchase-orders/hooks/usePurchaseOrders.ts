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
  AddPOCostRequest,
  UpdateImportDetailsRequest,
  ReceiveGoodsRequest,
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

/**
 * Story 2.3: Add a cost to a purchase order
 */
export const useAddPOCost = (poId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPOCostRequest) =>
      purchaseOrdersService.addCost(poId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['landedCost', poId] });
      toast.success('Cost added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add cost');
    },
  });
};

/**
 * Story 2.3: Get landed cost calculation
 */
export const useLandedCost = (poId: string) => {
  return useQuery({
    queryKey: ['landedCost', poId],
    queryFn: () => purchaseOrdersService.getLandedCost(poId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!poId,
  });
};

/**
 * Story 2.3: Update import details
 */
export const useUpdateImportDetails = (poId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateImportDetailsRequest) =>
      purchaseOrdersService.updateImportDetails(poId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      toast.success('Import details updated successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update import details'
      );
    },
  });
};

/**
 * Story 2.6: Check if PO can be received
 */
export const useCanReceivePO = (poId: string) => {
  return useQuery({
    queryKey: ['canReceivePO', poId],
    queryFn: () => purchaseOrdersService.canReceive(poId),
    enabled: !!poId,
    staleTime: 0, // Always refetch to get latest status
  });
};

/**
 * Story 2.6: Receive goods from PO
 */
export const useReceiveGoods = (poId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReceiveGoodsRequest) =>
      purchaseOrdersService.receiveGoods(poId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['canReceivePO', poId] });
      toast.success('Goods received successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to receive goods');
    },
  });
};
