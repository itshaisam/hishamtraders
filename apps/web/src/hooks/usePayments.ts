import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '../services/paymentsService';
import { CreateSupplierPaymentDto, CreateClientPaymentDto, PaymentFilters } from '../types/payment.types';
import toast from 'react-hot-toast';

/**
 * Hook to create a supplier payment
 */
export const useCreateSupplierPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierPaymentDto) =>
      paymentsService.createSupplierPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierPayments'] });
      queryClient.invalidateQueries({ queryKey: ['poBalance'] });
      toast.success('Supplier payment recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
};

/**
 * Hook to get supplier payments with filters
 */
export const useSupplierPayments = (filters: PaymentFilters) => {
  return useQuery({
    queryKey: ['supplierPayments', filters],
    queryFn: () => paymentsService.getSupplierPayments(filters),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get payment history for a specific supplier
 */
export const useSupplierPaymentHistory = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplierPaymentHistory', supplierId],
    queryFn: () => paymentsService.getSupplierPaymentHistory(supplierId),
    enabled: !!supplierId,
    staleTime: 30000,
  });
};

/**
 * Hook to get PO balance
 */
export const usePOBalance = (poId: string) => {
  return useQuery({
    queryKey: ['poBalance', poId],
    queryFn: () => paymentsService.getPOBalance(poId),
    enabled: !!poId,
    staleTime: 10000, // 10 seconds (fresher data for balance)
  });
};

/**
 * Hook to create a client payment (Story 3.6)
 */
export const useCreateClientPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientPaymentDto) =>
      paymentsService.createClientPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      queryClient.invalidateQueries({ queryKey: ['clientOutstandingInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Client payment recorded and allocated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
};

/**
 * Hook to get payment history for a specific client (Story 3.6)
 */
export const useClientPaymentHistory = (clientId: string) => {
  return useQuery({
    queryKey: ['clientPaymentHistory', clientId],
    queryFn: () => paymentsService.getClientPaymentHistory(clientId),
    enabled: !!clientId,
    staleTime: 30000,
  });
};

/**
 * Hook to get outstanding invoices for a client (Story 3.6)
 */
export const useClientOutstandingInvoices = (clientId: string) => {
  return useQuery({
    queryKey: ['clientOutstandingInvoices', clientId],
    queryFn: () => paymentsService.getClientOutstandingInvoices(clientId),
    enabled: !!clientId,
    staleTime: 10000,
  });
};

/**
 * Hook to get all client payments with optional client filter (Story 3.6)
 */
export const useAllClientPayments = (clientId?: string) => {
  return useQuery({
    queryKey: ['allClientPayments', clientId],
    queryFn: () => paymentsService.getAllClientPayments(clientId),
    staleTime: 30000,
  });
};
