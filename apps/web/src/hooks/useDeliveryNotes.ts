import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryNoteService } from '../services/deliveryNoteService';
import {
  DeliveryNote,
  CreateDeliveryNoteDto,
  DeliveryNoteFilters,
  DeliveryNoteListResponse,
} from '../types/delivery-note.types';
import toast from 'react-hot-toast';

export const deliveryNoteKeys = {
  all: ['delivery-notes'] as const,
  lists: () => [...deliveryNoteKeys.all, 'list'] as const,
  list: (filters?: DeliveryNoteFilters) => [...deliveryNoteKeys.lists(), filters] as const,
  details: () => [...deliveryNoteKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliveryNoteKeys.details(), id] as const,
};

export function useDeliveryNotes(filters?: DeliveryNoteFilters) {
  return useQuery<DeliveryNoteListResponse>({
    queryKey: deliveryNoteKeys.list(filters),
    queryFn: () => deliveryNoteService.getAll(filters),
  });
}

export function useDeliveryNote(id: string) {
  return useQuery<DeliveryNote>({
    queryKey: deliveryNoteKeys.detail(id),
    queryFn: () => deliveryNoteService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeliveryNoteDto) => deliveryNoteService.create(data),
    onSuccess: (dn) => {
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.lists() });
      toast.success(`Delivery Note ${dn.deliveryNoteNumber} created`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create delivery note';
      toast.error(message);
    },
  });
}

export function useDispatchDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveryNoteService.dispatch(id),
    onSuccess: (dn) => {
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.detail(dn.id) });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Delivery Note ${dn.deliveryNoteNumber} dispatched`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to dispatch delivery note';
      toast.error(message);
    },
  });
}

export function useDeliverDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveryNoteService.deliver(id),
    onSuccess: (dn) => {
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.detail(dn.id) });
      toast.success(`Delivery Note ${dn.deliveryNoteNumber} marked as delivered`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to mark as delivered';
      toast.error(message);
    },
  });
}

export function useCancelDeliveryNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason: string }) =>
      deliveryNoteService.cancel(id, cancelReason),
    onSuccess: (dn) => {
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryNoteKeys.detail(dn.id) });
      toast.success(`Delivery Note ${dn.deliveryNoteNumber} cancelled`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to cancel delivery note';
      toast.error(message);
    },
  });
}
