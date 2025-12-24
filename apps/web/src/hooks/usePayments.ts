import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '../services/paymentsService';
import { CreateSupplierPaymentDto, PaymentFilters } from '../types/payment.types';
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
