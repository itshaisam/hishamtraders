import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuditService } from '../services/audit.service.js';
import { AuthRequest } from '../types/auth.types.js';

export type RoleName =
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OFFICER'
  | 'ACCOUNTANT'
  | 'RECOVERY_AGENT';

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<RoleName, number> = {
  ADMIN: 5,
  ACCOUNTANT: 4,
  SALES_OFFICER: 3,
  WAREHOUSE_MANAGER: 2,
  RECOVERY_AGENT: 1,
};

/**
 * Middleware to check if user has required role(s)
 */
export function requireRole(allowedRoles: RoleName[]) {
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

      // Check if user's role is in allowed roles
      const hasPermission = allowedRoles.includes(userRoleName);

      if (!hasPermission) {
        // Log failed authorization attempt
        await AuditService.log({
          userId,
          action: 'VIEW',
          entityType: 'Permission',
          entityId: req.path,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          notes: `Access denied to ${req.method} ${req.path} - Required roles: ${allowedRoles.join(', ')}`,
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

/**
 * Check if user has minimum role level
 * Example: requireMinRole('SALES_OFFICER') allows SALES_OFFICER, ACCOUNTANT, and ADMIN
 */
export function requireMinRole(minRole: RoleName) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { userId } = req.user;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const userRoleName = user.role.name as RoleName;
      const userRoleLevel = ROLE_HIERARCHY[userRoleName] || 0;
      const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userRoleLevel < minRoleLevel) {
        await AuditService.log({
          userId,
          action: 'VIEW',
          entityType: 'Permission',
          entityId: req.path,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          notes: `Access denied to ${req.method} ${req.path} - Required min role: ${minRole}`,
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden - Insufficient permissions',
        });
      }

      req.user.roleName = userRoleName;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Admin-only middleware (shorthand)
 */
export const requireAdmin = requireRole(['ADMIN']);
