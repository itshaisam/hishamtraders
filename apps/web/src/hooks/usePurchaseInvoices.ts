import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseInvoiceService } from '../services/purchaseInvoiceService';
import { PurchaseInvoiceFilters, CreatePurchaseInvoiceDto } from '../types/purchase-invoice.types';
import toast from 'react-hot-toast';

const purchaseInvoiceKeys = {
  all: ['purchase-invoices'] as const,
  lists: () => [...purchaseInvoiceKeys.all, 'list'] as const,
  list: (filters?: PurchaseInvoiceFilters) => [...purchaseInvoiceKeys.lists(), filters] as const,
  details: () => [...purchaseInvoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseInvoiceKeys.details(), id] as const,
  matching: (id: string) => [...purchaseInvoiceKeys.all, 'matching', id] as const,
};

export function usePurchaseInvoices(filters?: PurchaseInvoiceFilters) {
  return useQuery({
    queryKey: purchaseInvoiceKeys.list(filters),
    queryFn: () => purchaseInvoiceService.getAll(filters),
  });
}

export function usePurchaseInvoice(id: string) {
  return useQuery({
    queryKey: purchaseInvoiceKeys.detail(id),
    queryFn: () => purchaseInvoiceService.getById(id),
    enabled: !!id,
  });
}

export function usePurchaseInvoiceMatching(id: string) {
  return useQuery({
    queryKey: purchaseInvoiceKeys.matching(id),
    queryFn: () => purchaseInvoiceService.getMatching(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseInvoiceDto) => purchaseInvoiceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      toast.success('Purchase Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create purchase invoice');
    },
  });
}

export function useCancelPurchaseInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason: string }) =>
      purchaseInvoiceService.cancel(id, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseInvoiceKeys.all });
      toast.success('Purchase Invoice cancelled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel purchase invoice');
    },
  });
}
