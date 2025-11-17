import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PaymentTerm {
  id: string;
  name: string;
  description?: string;
  days?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usePaymentTerms = () => {
  return useQuery({
    queryKey: ['payment-terms'],
    queryFn: async () => {
      const response = await apiClient.get('/payment-terms');
      return response.data.data as PaymentTerm[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const usePaymentTermsForSelect = () => {
  const { data: paymentTerms, isLoading, error } = usePaymentTerms();

  return {
    options: paymentTerms?.map((term) => ({
      value: term.id,
      label: term.name,
    })) || [],
    isLoading,
    error,
  };
};
