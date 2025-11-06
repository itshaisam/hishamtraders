import { AuditService, AuditLogData } from '../services/audit.service.js';
import { AuthRequest } from '../types/auth.types.js';

/**
 * Manual audit logging helper for complex operations
 * Use this when automatic middleware isn't sufficient
 */
export async function auditLog(
  req: AuthRequest,
  data: Omit<AuditLogData, 'userId' | 'ipAddress' | 'userAgent'>
) {
  if (!req.user) {
    console.warn('Attempted to audit without user context');
    return;
  }

  await AuditService.log({
    ...data,
    userId: req.user.userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
}

/**
 * Audit a VIEW operation (for sensitive data access)
 */
export async function auditView(
  req: AuthRequest,
  entityType: string,
  entityId: string,
  notes?: string
) {
  await auditLog(req, {
    action: 'VIEW',
    entityType,
    entityId,
    notes: notes || `Viewed ${entityType} ${entityId}`,
  });
}
