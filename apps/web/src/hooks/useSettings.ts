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

export const useCurrencySymbol = () => {
  return useQuery({
    queryKey: ['settings', 'currency-symbol'],
    queryFn: () => settingsService.getCurrencySymbol(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCurrencySymbol = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currencySymbol: string) => settingsService.updateCurrencySymbol(currencySymbol),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'currency-symbol'] });
      toast.success(data.message || 'Currency symbol updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update currency symbol');
    },
  });
};

export const useCompanyName = () => {
  return useQuery({
    queryKey: ['settings', 'company-name'],
    queryFn: () => settingsService.getCompanyName(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCompanyName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyName: string) => settingsService.updateCompanyName(companyName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'company-name'] });
      toast.success(data.message || 'Company name updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company name');
    },
  });
};

export const useCompanyLogo = () => {
  return useQuery({
    queryKey: ['settings', 'company-logo'],
    queryFn: () => settingsService.getCompanyLogo(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCompanyLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyLogo: string) => settingsService.updateCompanyLogo(companyLogo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'company-logo'] });
      toast.success(data.message || 'Company logo updated!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company logo');
    },
  });
};
