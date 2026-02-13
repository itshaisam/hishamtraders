import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLogParams } from '../services/auditService';

export const useAuditLogs = (params: AuditLogParams = {}) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditService.getAuditLogs(params),
    staleTime: 30 * 1000,
  });
};
