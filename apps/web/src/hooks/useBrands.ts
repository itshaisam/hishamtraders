import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

export interface Brand {
  id: string;
  name: string;
  country?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandRequest {
  name: string;
  country?: string;
}

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await apiClient.get('/brands');
      return response.data.data as Brand[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useBrandsForSelect = () => {
  const { data: brands, isLoading, error } = useBrands();

  return {
    options: brands?.map((brand) => ({
      value: brand.id,
      label: brand.name,
    })) || [],
    isLoading,
    error,
  };
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBrandRequest) => {
      const response = await apiClient.post('/brands', data);
      return response.data.data as Brand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create brand');
    },
  });
};
