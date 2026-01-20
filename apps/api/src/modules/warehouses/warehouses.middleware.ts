import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../../lib/logger.js';

const prisma = new PrismaClient();

export const auditLog = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;
    const entityId = req.params.id || null;

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function (body: any): Response {
      // Only log if successful
      if (body.success) {
        const changedFields: any = {};

        // Capture changed fields based on action
        if (action === 'CREATE_WAREHOUSE') {
          changedFields.name = { new: req.body.name };
          changedFields.location = { new: req.body.location };
          changedFields.city = { new: req.body.city };
          changedFields.status = { new: req.body.status || 'ACTIVE' };
        } else if (action === 'UPDATE_WAREHOUSE') {
          Object.keys(req.body).forEach((key) => {
            changedFields[key] = { new: req.body[key] };
          });
        }

        // Create audit log entry
        prisma.auditLog
          .create({
            data: {
              userId: user.userId,
              action,
              entityType: 'Warehouse',
              entityId: entityId || body.data?.id || null,
              ipAddress: req.ip || req.socket.remoteAddress || null,
              userAgent: req.get('user-agent') || null,
              changedFields: Object.keys(changedFields).length > 0 ? changedFields : null,
            },
          })
          .then(() => {
            logger.info('Audit log created', { action, userId: user.id, entityId });
          })
          .catch((error) => {
            logger.error('Failed to create audit log', { error: error.message });
          });
      }

      return originalJson(body);
    };

    next();
  };
};
