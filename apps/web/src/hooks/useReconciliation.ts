import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../services/accountingService';

export function useReconciliations(filters: { bankAccountId?: string; status?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['reconciliations', filters],
    queryFn: () => accountingService.getReconciliations(filters),
  });
}

export function useReconciliation(id: string) {
  return useQuery({
    queryKey: ['reconciliation', id],
    queryFn: () => accountingService.getReconciliationById(id),
    enabled: !!id,
  });
}

export function useUnmatchedTransactions(reconciliationId: string) {
  return useQuery({
    queryKey: ['reconciliation', reconciliationId, 'unmatched'],
    queryFn: () => accountingService.getUnmatchedTransactions(reconciliationId),
    enabled: !!reconciliationId,
  });
}

export function useCreateReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bankAccountId: string; statementDate: string; statementBalance: number }) =>
      accountingService.createReconciliation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
    },
  });
}

export function useAddReconciliationItem(reconciliationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { description: string; statementAmount: number; statementDate: string }) =>
      accountingService.addReconciliationItem(reconciliationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId] });
    },
  });
}

export function useDeleteReconciliationItem(reconciliationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => accountingService.deleteReconciliationItem(reconciliationId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId] });
    },
  });
}

export function useMatchItem(reconciliationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, journalEntryLineId }: { itemId: string; journalEntryLineId: string }) =>
      accountingService.matchReconciliationItem(reconciliationId, itemId, journalEntryLineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId, 'unmatched'] });
    },
  });
}

export function useUnmatchItem(reconciliationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => accountingService.unmatchReconciliationItem(reconciliationId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId, 'unmatched'] });
    },
  });
}

export function useCompleteReconciliation(reconciliationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => accountingService.completeReconciliation(reconciliationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', reconciliationId] });
    },
  });
}
