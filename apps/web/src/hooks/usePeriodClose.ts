import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../services/accountingService';

export function usePeriodCloses() {
  return useQuery({
    queryKey: ['period-closes'],
    queryFn: () => accountingService.getPeriodCloses(),
  });
}

export function useMonthPnL(year: number, month: number) {
  return useQuery({
    queryKey: ['month-pnl', year, month],
    queryFn: () => accountingService.getMonthPnL(year, month),
    enabled: !!year && !!month,
  });
}

export function useCloseMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      accountingService.closeMonth(year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-closes'] });
    },
  });
}

export function useReopenPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      accountingService.reopenPeriod(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-closes'] });
    },
  });
}
