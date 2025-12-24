import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService } from '../services/invoicesService';
import {
  Invoice,
  CreateInvoiceDto,
  InvoiceFilters,
  InvoiceListResponse,
} from '../types/invoice.types';
import { toast } from 'react-hot-toast';

const QUERY_KEYS = {
  invoices: (filters?: InvoiceFilters) => ['invoices', filters] as const,
  invoice: (id: string) => ['invoice', id] as const,
};

/**
 * Hook to fetch all invoices with filters
 */
export const useInvoices = (filters?: InvoiceFilters) => {
  return useQuery<InvoiceListResponse>({
    queryKey: QUERY_KEYS.invoices(filters),
    queryFn: () => invoicesService.getInvoices(filters),
  });
};

/**
 * Hook to fetch invoice by ID
 */
export const useInvoiceById = (id: string) => {
  return useQuery<Invoice>({
    queryKey: QUERY_KEYS.invoice(id),
    queryFn: () => invoicesService.getInvoiceById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create invoice
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoicesService.createInvoice(data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Invoice ${invoice.invoiceNumber} created successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create invoice';
      toast.error(message);
    },
  });
};
