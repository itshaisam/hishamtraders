import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../services/accountingService';
import {
  CreateAccountHeadDto,
  UpdateAccountHeadDto,
  AccountHeadFilters,
} from '../types/accounting.types';
import toast from 'react-hot-toast';

export const useAccountHeads = (filters: AccountHeadFilters = {}) => {
  return useQuery({
    queryKey: ['account-heads', filters],
    queryFn: () => accountingService.getAccountHeads(filters),
  });
};

export const useAccountHeadTree = () => {
  return useQuery({
    queryKey: ['account-heads', 'tree'],
    queryFn: () => accountingService.getAccountHeadTree(),
  });
};

export const useAccountHead = (id: string) => {
  return useQuery({
    queryKey: ['account-heads', id],
    queryFn: () => accountingService.getAccountHeadById(id),
    enabled: !!id,
  });
};

export const useCreateAccountHead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountHeadDto) => accountingService.createAccountHead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-heads'] });
      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create account');
    },
  });
};

export const useUpdateAccountHead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountHeadDto }) =>
      accountingService.updateAccountHead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-heads'] });
      toast.success('Account updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update account');
    },
  });
};

export const useDeleteAccountHead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountingService.deleteAccountHead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-heads'] });
      toast.success('Account deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });
};
