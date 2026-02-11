import { apiClient } from '../lib/api-client';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  changedFields: Record<string, { old: unknown; new: unknown }> | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditService = {
  async getAuditLogs(params: AuditLogParams = {}) {
    const response = await apiClient.get<{
      success: boolean;
      data: AuditLogResponse;
    }>('/audit-logs', { params });
    return response.data.data;
  },
};
