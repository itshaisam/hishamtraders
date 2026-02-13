import { apiClient } from '../lib/api-client';

export interface ChangeHistoryVersion {
  id: string;
  version: number;
  changedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  changedAt: string;
  snapshot: Record<string, unknown>;
  changeReason: string | null;
}

export interface CanRollbackResult {
  canRollback: boolean;
  warning?: string;
  blockedReason?: string;
}

export interface RollbackPayload {
  entityType: string;
  entityId: string;
  targetVersion: number;
  reason: string;
}

export const changeHistoryService = {
  async getHistory(entityType: string, entityId: string): Promise<ChangeHistoryVersion[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: ChangeHistoryVersion[];
    }>(`/change-history/${entityType}/${entityId}`);
    return response.data.data;
  },

  async canRollback(entityType: string, entityId: string): Promise<CanRollbackResult> {
    const response = await apiClient.get<{
      success: boolean;
      data: CanRollbackResult;
    }>(`/change-history/${entityType}/${entityId}/can-rollback`);
    return response.data.data;
  },

  async rollback(payload: RollbackPayload): Promise<{ fieldsRestored: string[] }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { fieldsRestored: string[] };
    }>('/change-history/rollback', payload);
    return response.data.data;
  },
};
