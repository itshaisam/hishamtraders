import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { UnitOfMeasure, CreateUomRequest, UpdateUomRequest } from '@/types/uom.types';

export const useUoms = () => {
  return useQuery({
    queryKey: ['uoms'],
    queryFn: async () => {
      const response = await apiClient.get('/uoms');
      return response.data.data as UnitOfMeasure[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useUomsForSelect = () => {
  const { data: uoms, isLoading, error } = useUoms();

  return {
    options: uoms?.map((uom) => ({
      value: uom.id,
      label: `${uom.name} (${uom.abbreviation})`,
    })) || [],
    isLoading,
    error,
  };
};

export const useCreateUom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUomRequest) => {
      const response = await apiClient.post('/uoms', data);
      return response.data.data as UnitOfMeasure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      toast.success('Unit of measure created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create unit of measure');
    },
  });
};

export const useUpdateUom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUomRequest }) => {
      const response = await apiClient.put(`/uoms/${id}`, data);
      return response.data.data as UnitOfMeasure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      toast.success('Unit of measure updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update unit of measure');
    },
  });
};

export const useDeleteUom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/uoms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uoms'] });
      toast.success('Unit of measure deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete unit of measure');
    },
  });
};
