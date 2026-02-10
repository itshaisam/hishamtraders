import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';
import toast from 'react-hot-toast';

export const useGetTaxRate = () => {
  return useQuery({
    queryKey: ['settings', 'tax-rate'],
    queryFn: () => settingsService.getTaxRate(),
    staleTime: 5 * 60 * 1000, // 5 minutes — matches backend cache TTL
  });
};

export const useUpdateTaxRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taxRate: number) => settingsService.updateTaxRate(taxRate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'tax-rate'] });
      toast.success(data.message || 'Tax rate updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update tax rate');
    },
  });
};
