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
  changedFieldsSummary: string[];
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
  entityId?: string;
  ipAddress?: string;
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

  async getAuditLogDetail(id: string) {
    const response = await apiClient.get<{
      success: boolean;
      data: AuditLogEntry;
    }>(`/audit-logs/${id}`);
    return response.data.data;
  },

  async exportAuditLogs(params: AuditLogParams = {}) {
    const response = await apiClient.get('/audit-logs/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
