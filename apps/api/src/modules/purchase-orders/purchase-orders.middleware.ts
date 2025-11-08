import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Audit middleware for purchase order operations
 */
export const auditPurchaseOrderAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      if (res.statusCode < 400 && ['CREATE', 'UPDATE', 'DELETE'].includes(action)) {
        const userId = req.user?.userId;

        if (userId) {
          const entityId = req.params.id || (data?.data?.id || '');
          const poNumber = data?.data?.poNumber;

          // Capture changed fields for updates
          let changedFieldsJson: any = null;
          if (action === 'UPDATE' && req.body) {
            changedFieldsJson = req.body;
          }

          // Log audit record asynchronously
          prisma.auditLog.create({
            data: {
              userId,
              action,
              entityType: 'PurchaseOrder',
              entityId,
              changedFields: changedFieldsJson,
              notes: `PO Number: ${poNumber}`,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            },
          }).catch((err) => {
            console.error('Failed to create audit log:', err);
          });
        }
      }

      res.send = originalSend;
      return originalSend.call(this, data);
    };

    next();
  };
};
