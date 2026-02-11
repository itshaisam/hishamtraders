import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditNotesService } from '../services/creditNotesService';
import {
  CreditNote,
  CreateCreditNoteDto,
  CreditNoteFilters,
  CreditNoteListResponse,
} from '../types/credit-note.types';
import { toast } from 'react-hot-toast';

const QUERY_KEYS = {
  creditNotes: (filters?: CreditNoteFilters) => ['credit-notes', filters] as const,
  creditNote: (id: string) => ['credit-note', id] as const,
};

export const useCreditNotes = (filters?: CreditNoteFilters) => {
  return useQuery<CreditNoteListResponse>({
    queryKey: QUERY_KEYS.creditNotes(filters),
    queryFn: () => creditNotesService.getAll(filters),
  });
};

export const useCreditNote = (id: string) => {
  return useQuery<CreditNote>({
    queryKey: QUERY_KEYS.creditNote(id),
    queryFn: () => creditNotesService.getById(id),
    enabled: !!id,
  });
};

export const useCreateCreditNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditNoteDto) => creditNotesService.create(data),
    onSuccess: (creditNote) => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Credit note ${creditNote.creditNoteNumber} created successfully`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create credit note';
      toast.error(message);
    },
  });
};

export const useVoidCreditNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      creditNotesService.voidCreditNote(id, reason),
    onSuccess: (creditNote) => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['credit-note'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(`Credit note ${creditNote.creditNoteNumber} has been voided`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to void credit note';
      toast.error(message);
    },
  });
};

export const useApplyCreditNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => creditNotesService.applyCreditNote(id),
    onSuccess: (creditNote) => {
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['credit-note'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Credit note ${creditNote.creditNoteNumber} marked as applied`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to apply credit note';
      toast.error(message);
    },
  });
};
