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
      const auditableActions = ['CREATE', 'UPDATE', 'DELETE', 'ADD_COST', 'UPDATE_IMPORT_DETAILS'];

      if (res.statusCode < 400 && auditableActions.includes(action)) {
        const userId = req.user?.userId;

        if (userId) {
          const entityId = req.params.id || (data?.data?.id || '');
          const poNumber = data?.data?.poNumber;

          // Capture changed fields for updates and cost additions
          let changedFieldsJson: any = null;
          if (['UPDATE', 'ADD_COST', 'UPDATE_IMPORT_DETAILS'].includes(action) && req.body) {
            changedFieldsJson = req.body;
          }

          // Create notes based on action type
          let notes = `PO Number: ${poNumber}`;
          if (action === 'ADD_COST') {
            notes += ` | Cost Type: ${req.body?.type} | Amount: ${req.body?.amount}`;
          } else if (action === 'UPDATE_IMPORT_DETAILS') {
            notes += ` | Import Details Updated`;
          }

          // Log audit record asynchronously
          prisma.auditLog.create({
            data: {
              userId,
              action,
              entityType: 'PurchaseOrder',
              entityId,
              changedFields: changedFieldsJson,
              notes,
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
