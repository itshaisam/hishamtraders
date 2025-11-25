import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuditService } from '../services/audit.service.js';
import { AuthRequest } from '../types/auth.types.js';
import { hasPermission } from '../utils/permission.utils.js';
import { PermissionResource, PermissionAction } from '../config/permissions.js';
import { RoleName } from './role.middleware.js';

/**
 * Middleware to check if user has permission to perform an action on a resource
 * Uses the centralized permission matrix from config/permissions.ts
 *
 * Example usage:
 *   router.post('/', requirePermission('products', 'create'), controller.create)
 */
export function requirePermission(resource: PermissionResource, action: PermissionAction) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - No user context',
        });
      }

      const { userId } = req.user;

      // Fetch user's role from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - Invalid role',
        });
      }

      const userRoleName = user.role.name as RoleName;

      // Check if user's role has permission for this resource/action
      const hasAccess = hasPermission(userRoleName, resource, action);

      if (!hasAccess) {
        // Log failed authorization attempt
        await AuditService.log({
          userId,
          action: 'PERMISSION_CHECK',
          entityType: 'Permission',
          entityId: `${resource}:${action}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          notes: `Access denied to ${req.method} ${req.path} - Required: ${resource}:${action}, User role: ${userRoleName}`,
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden - Insufficient permissions',
        });
      }

      // Attach role name to request for further use
      req.user.roleName = userRoleName;

      next();
    } catch (error) {
      next(error);
    }
  };
}
