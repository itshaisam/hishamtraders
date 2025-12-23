import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../services/audit.service.js';

// Audit logging middleware for products
export const auditProductAction = (action: 'CREATE' | 'UPDATE' | 'DELETE') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const productId = req.params.id || (res.locals.createdEntity?.id);
        let changedFields: Record<string, unknown> = {};
        let notes = '';

        if (action === 'CREATE') {
          changedFields = {
            sku: req.body.sku,
            name: req.body.name,
            categoryId: req.body.categoryId,
            brandId: req.body.brandId,
            uomId: req.body.uomId,
            unitPrice: req.body.unitPrice,
            status: req.body.status || 'ACTIVE',
          };
          notes = `Created product: ${req.body.name} (SKU: ${req.body.sku})`;
        } else if (action === 'UPDATE') {
          changedFields = req.body;
          notes = `Updated product ID: ${productId}`;
        } else if (action === 'DELETE') {
          notes = `Deleted product ID: ${productId}`;
        }

        await AuditService.log({
          userId: user?.userId,
          action,
          entityType: 'Product',
          entityId: productId,
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
