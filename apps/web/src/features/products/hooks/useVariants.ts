import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { variantsService } from '../services/variantsService';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantFilterParams,
} from '../types/variant.types';

export const useVariants = (filters: VariantFilterParams) => {
  return useQuery({
    queryKey: ['variants', filters],
    queryFn: () => variantsService.getVariants(filters),
  });
};

export const useVariant = (id: string) => {
  return useQuery({
    queryKey: ['variant', id],
    queryFn: () => variantsService.getVariantById(id),
    enabled: !!id,
  });
};

export const useVariantsByProduct = (productId: string, status?: 'ACTIVE' | 'INACTIVE') => {
  return useQuery({
    queryKey: ['variants', 'product', productId, status],
    queryFn: () => variantsService.getVariantsByProductId(productId, status),
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVariantDto) => variantsService.createVariant(data),
    onSuccess: (response) => {
      toast.success(response.message || 'Variant created successfully');
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create variant');
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVariantDto }) =>
      variantsService.updateVariant(id, data),
    onSuccess: (response) => {
      toast.success(response.message || 'Variant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update variant');
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => variantsService.deleteVariant(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Variant deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to delete variant');
    },
  });
};
