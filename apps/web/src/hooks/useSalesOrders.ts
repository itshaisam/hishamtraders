import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOrderService } from '../services/salesOrderService';
import {
  SalesOrder,
  CreateSalesOrderDto,
  SalesOrderFilters,
  SalesOrderListResponse,
} from '../types/sales-order.types';
import toast from 'react-hot-toast';

export const salesOrderKeys = {
  all: ['sales-orders'] as const,
  lists: () => [...salesOrderKeys.all, 'list'] as const,
  list: (filters?: SalesOrderFilters) => [...salesOrderKeys.lists(), filters] as const,
  details: () => [...salesOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...salesOrderKeys.details(), id] as const,
};

export function useSalesOrders(filters?: SalesOrderFilters) {
  return useQuery<SalesOrderListResponse>({
    queryKey: salesOrderKeys.list(filters),
    queryFn: () => salesOrderService.getAll(filters),
  });
}

export function useSalesOrder(id: string) {
  return useQuery<SalesOrder>({
    queryKey: salesOrderKeys.detail(id),
    queryFn: () => salesOrderService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesOrderDto) => salesOrderService.create(data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      toast.success(`Sales Order ${order.orderNumber} created successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create sales order';
      toast.error(message);
    },
  });
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrderService.confirm(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales Order ${order.orderNumber} confirmed`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to confirm sales order';
      toast.error(message);
    },
  });
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason: string }) =>
      salesOrderService.cancel(id, cancelReason),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales Order ${order.orderNumber} cancelled`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to cancel sales order';
      toast.error(message);
    },
  });
}

export function useCloseSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrderService.close(id),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(order.id) });
      toast.success(`Sales Order ${order.orderNumber} closed`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to close sales order';
      toast.error(message);
    },
  });
}
