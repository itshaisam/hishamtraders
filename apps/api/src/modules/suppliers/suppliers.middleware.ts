import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';

// Audit logging middleware for suppliers
export const auditSupplierAction = (action: 'CREATE' | 'UPDATE' | 'DELETE') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store action and data for later logging in the response
    const user = (req as any).user;

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let details = {};

        if (action === 'CREATE') {
          details = {
            supplierName: req.body.name,
            email: req.body.email,
            country: req.body.country,
          };
        } else if (action === 'UPDATE') {
          details = {
            supplierId: req.params.id,
            changedFields: Object.keys(req.body),
          };
        } else if (action === 'DELETE') {
          details = {
            supplierId: req.params.id,
          };
        }

        logger.info(`SUPPLIER_${action}`, {
          userId: user?.userId,
          action: `SUPPLIER_${action}`,
          supplierId: req.params.id || req.body.id,
          details,
          ipAddress: req.ip,
        });
      }
    });

    next();
  };
};
