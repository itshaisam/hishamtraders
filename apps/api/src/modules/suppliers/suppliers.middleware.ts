import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../services/audit.service.js';

// Audit logging middleware for suppliers
export const auditSupplierAction = (action: 'CREATE' | 'UPDATE' | 'DELETE') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store action and data for later logging in the response
    const user = (req as any).user;

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const supplierId = req.params.id || (res.locals.createdEntity?.id);
        let changedFields: Record<string, unknown> = {};
        let notes = '';

        if (action === 'CREATE') {
          changedFields = {
            name: req.body.name,
            email: req.body.email,
            countryId: req.body.countryId,
            paymentTermId: req.body.paymentTermId,
            status: req.body.status || 'ACTIVE',
          };
          notes = `Created supplier: ${req.body.name}`;
        } else if (action === 'UPDATE') {
          changedFields = req.body;
          notes = `Updated supplier ID: ${supplierId}`;
        } else if (action === 'DELETE') {
          notes = `Deleted supplier ID: ${supplierId}`;
        }

        await AuditService.log({
          userId: user?.userId,
          action,
          entityType: 'Supplier',
          entityId: supplierId,
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
