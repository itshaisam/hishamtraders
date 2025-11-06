import { Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service.js';
import { AuthRequest } from '../types/auth.types.js';

export const auditMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Only audit mutating operations
  const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!shouldAudit || !req.user) {
    return next();
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to log after successful response
  res.json = function (data: any) {
    // Only log if request was successful (status < 400)
    if (res.statusCode < 400) {
      // Extract entity information from URL and data
      const pathParts = req.path.split('/').filter(Boolean);
      const entityType = pathParts[pathParts.length - 1] || 'Unknown';
      const entityId = data?.data?.id || data?.id;

      // Determine action from HTTP method
      let action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE';
      if (req.method === 'POST') action = 'CREATE';
      if (req.method === 'DELETE') action = 'DELETE';
      if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';

      // Extract changed fields for UPDATE operations
      let changedFields;
      if (action === 'UPDATE' && req.body) {
        changedFields = AuditService.extractChangedFields(
          (req.body as any)._original || null,
          req.body
        );
      }

      // Log asynchronously (don't await - fire and forget)
      AuditService.log({
        userId: req.user!.userId,
        action,
        entityType: capitalizeEntityType(entityType),
        entityId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        changedFields,
        notes: `${action} operation via ${req.method} ${req.path}`,
      }).catch((err) => {
        console.error('Audit log failed:', err);
      });
    }

    // Call original res.json
    return originalJson(data);
  };

  next();
};

/**
 * Helper to capitalize and singularize entity type
 */
function capitalizeEntityType(entityType: string): string {
  // Remove trailing 's' if present (products -> product)
  const singular = entityType.endsWith('s')
    ? entityType.slice(0, -1)
    : entityType;

  // Capitalize first letter
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}
