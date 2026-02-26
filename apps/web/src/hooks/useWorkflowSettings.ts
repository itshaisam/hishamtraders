import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface WorkflowSettings {
  'sales.requireSalesOrder': boolean;
  'sales.requireDeliveryNote': boolean;
  'sales.allowDirectInvoice': boolean;
  'purchasing.requirePurchaseInvoice': boolean;
  'sales.enableStockReservation': boolean;
}

export function useWorkflowSettings() {
  return useQuery<WorkflowSettings>({
    queryKey: ['workflow-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: WorkflowSettings }>(
        '/settings/workflow'
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — matches backend cache TTL
  });
}
