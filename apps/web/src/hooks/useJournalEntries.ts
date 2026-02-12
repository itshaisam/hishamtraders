import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../services/accountingService';
import {
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  JournalEntryFilters,
} from '../types/accounting.types';
import toast from 'react-hot-toast';

export const useJournalEntries = (filters: JournalEntryFilters = {}) => {
  return useQuery({
    queryKey: ['journal-entries', filters],
    queryFn: () => accountingService.getJournalEntries(filters),
  });
};

export const useJournalEntry = (id: string) => {
  return useQuery({
    queryKey: ['journal-entries', id],
    queryFn: () => accountingService.getJournalEntryById(id),
    enabled: !!id,
  });
};

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJournalEntryDto) => accountingService.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Journal entry created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create journal entry');
    },
  });
};

export const useUpdateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJournalEntryDto }) =>
      accountingService.updateJournalEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Journal entry updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update journal entry');
    },
  });
};

export const usePostJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountingService.postJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['account-heads'] });
      toast.success('Journal entry posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to post journal entry');
    },
  });
};

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountingService.deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Journal entry deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete journal entry');
    },
  });
};
