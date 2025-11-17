import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Country {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await apiClient.get('/countries');
      return response.data.data as Country[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCountriesForSelect = () => {
  const { data: countries, isLoading, error } = useCountries();

  return {
    options: countries?.map((country) => ({
      value: country.id,
      label: `${country.name} (${country.code})`,
    })) || [],
    isLoading,
    error,
  };
};
