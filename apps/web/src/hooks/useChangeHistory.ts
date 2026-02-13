import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changeHistoryService, RollbackPayload } from '../services/changeHistoryService';

export const useChangeHistory = (
  entityType: string,
  entityId: string,
  enabled = false
) => {
  return useQuery({
    queryKey: ['change-history', entityType, entityId],
    queryFn: () => changeHistoryService.getHistory(entityType, entityId),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useCanRollback = (
  entityType: string,
  entityId: string,
  enabled = false
) => {
  return useQuery({
    queryKey: ['can-rollback', entityType, entityId],
    queryFn: () => changeHistoryService.canRollback(entityType, entityId),
    enabled,
    staleTime: 30 * 1000,
  });
};

export const useRollback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RollbackPayload) => changeHistoryService.rollback(payload),
    onSuccess: (_data, variables) => {
      // Invalidate change history and entity data
      queryClient.invalidateQueries({ queryKey: ['change-history', variables.entityType, variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['can-rollback', variables.entityType, variables.entityId] });
      // Invalidate entity-specific queries
      const entityQueryMap: Record<string, string> = {
        PRODUCT: 'product',
        CLIENT: 'client',
        SUPPLIER: 'supplier',
        PURCHASE_ORDER: 'purchase-order',
        INVOICE: 'invoice',
      };
      const queryKey = entityQueryMap[variables.entityType];
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey: [queryKey, variables.entityId] });
        queryClient.invalidateQueries({ queryKey: [`${queryKey}s`] });
      }
    },
  });
};
