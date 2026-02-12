import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../services/accountingService';

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => accountingService.getBankAccounts(),
  });
}

export function usePettyCashBalance() {
  return useQuery({
    queryKey: ['petty-cash', 'balance'],
    queryFn: () => accountingService.getPettyCashBalance(),
  });
}

export function usePettyCashTransactions(limit: number = 20) {
  return useQuery({
    queryKey: ['petty-cash', 'transactions', limit],
    queryFn: () => accountingService.getPettyCashTransactions(limit),
  });
}

export function useCreatePettyCashAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, bankAccountId }: { amount: number; bankAccountId: string }) =>
      accountingService.createPettyCashAdvance(amount, bankAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-heads'] });
    },
  });
}
