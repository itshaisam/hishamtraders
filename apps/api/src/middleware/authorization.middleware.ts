import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.types.js';

/**
 * Authorization middleware to check if user has required role(s)
 * @param allowedRoles - Array of role names that are allowed to access the route
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: No user found in request',
        });
      }

      // Get user role name from request
      const userRole = req.user.roleName;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: User role not found',
        });
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: ${userRole} role does not have access to this resource`,
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking authorization',
      });
    }
  };
};
