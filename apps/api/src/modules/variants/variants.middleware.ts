import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/auth.types';
import { AuditService } from '../../services/audit.service.js';

// Audit logging middleware for product variants
export const auditVariantAction = (action: 'CREATE' | 'UPDATE' | 'DELETE') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const variantId = req.params.id || (res.locals.createdEntity?.id);
        let changedFields: Record<string, unknown> = {};
        let notes = '';

        if (action === 'CREATE') {
          changedFields = {
            sku: req.body.sku,
            variantName: req.body.variantName,
            productId: req.body.productId,
            attributes: req.body.attributes,
          };
          notes = `Created variant: ${req.body.variantName} (SKU: ${req.body.sku})`;
        } else if (action === 'UPDATE') {
          changedFields = req.body;
          notes = `Updated variant ID: ${variantId}`;
        } else if (action === 'DELETE') {
          notes = `Deleted variant ID: ${variantId}`;
        }

        await AuditService.log({
          userId: user?.userId || '',
          action,
          entityType: 'ProductVariant',
          entityId: variantId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          changedFields: Object.keys(changedFields).length > 0 ? changedFields as any : undefined,
          notes,
        });
      }
    });

    next();
  };
};
