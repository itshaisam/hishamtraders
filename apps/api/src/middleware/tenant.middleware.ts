import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../lib/prisma.js';

/**
 * Wraps the request in a tenant context using AsyncLocalStorage.
 * Must be placed AFTER auth middleware (needs req.user.tenantId).
 * Skipped for unauthenticated routes (auth middleware sets req.user = undefined).
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // If no authenticated user, skip (public routes like login, health)
  if (!req.user) {
    return next();
  }

  // Authenticated user MUST have a tenantId
  if (!req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'User has no tenant assigned. Contact administrator.',
    });
  }

  // Run the rest of the request inside the tenant context
  tenantContext.run({ tenantId: req.user.tenantId }, () => {
    next();
  });
}
