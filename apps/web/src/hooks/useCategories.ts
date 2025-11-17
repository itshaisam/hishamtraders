import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data.data as Category[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCategoriesForSelect = () => {
  const { data: categories, isLoading, error } = useCategories();

  return {
    options: categories?.map((category) => ({
      value: category.id,
      label: category.name,
    })) || [],
    isLoading,
    error,
  };
};
