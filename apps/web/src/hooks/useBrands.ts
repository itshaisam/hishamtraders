import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Brand {
  id: string;
  name: string;
  country?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
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
