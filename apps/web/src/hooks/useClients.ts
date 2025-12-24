import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFilters,
} from '../types/client.types';
import toast from 'react-hot-toast';

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters?: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  cities: () => [...clientKeys.all, 'cities'] as const,
};

// Fetch all clients
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => clientsService.getClients(filters),
  });
}

// Fetch single client by ID
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsService.getClientById(id),
    enabled: !!id,
  });
}

// Fetch all cities
export function useCities() {
  return useQuery({
    queryKey: clientKeys.cities(),
    queryFn: () => clientsService.getAllCities(),
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.cities() });
      toast.success('Client created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create client';
      toast.error(message);
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientsService.updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.cities() });
      toast.success('Client updated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update client';
      toast.error(message);
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientsService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success('Client deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete client';
      toast.error(message);
    },
  });
}
