import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';

// Audit logging middleware for products
export const auditProductAction = (action: 'CREATE' | 'UPDATE' | 'DELETE') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let details = {};

        if (action === 'CREATE') {
          details = {
            sku: req.body.sku,
            productName: req.body.name,
            category: req.body.category,
          };
        } else if (action === 'UPDATE') {
          details = {
            productId: req.params.id,
            changedFields: Object.keys(req.body),
          };
        } else if (action === 'DELETE') {
          details = {
            productId: req.params.id,
          };
        }

        logger.info(`PRODUCT_${action}`, {
          userId: user?.userId,
          action: `PRODUCT_${action}`,
          productId: req.params.id || req.body.id,
          details,
          ipAddress: req.ip,
        });
      }
    });

    next();
  };
};
