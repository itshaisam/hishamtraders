import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/auth.types';
import logger from '../../lib/logger.js';

interface AuditDetails {
  sku?: string;
  variantName?: string;
  productId?: string;
  variantId?: string;
  changedFields?: string[];
}

// Audit logging middleware for product variants
export const auditVariantAction = (action: 'CREATE' | 'UPDATE' | 'DELETE') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let details: AuditDetails = {};

        if (action === 'CREATE') {
          details = {
            sku: req.body.sku as string | undefined,
            variantName: req.body.variantName as string | undefined,
            productId: req.body.productId as string | undefined,
          };
        } else if (action === 'UPDATE') {
          details = {
            variantId: req.params.id,
            changedFields: Object.keys(req.body),
          };
        } else if (action === 'DELETE') {
          details = {
            variantId: req.params.id,
          };
        }

        logger.info(`VARIANT_${action}`, {
          userId: user?.userId,
          action: `VARIANT_${action}`,
          variantId: req.params.id || (req.body.id as string | undefined),
          details,
          ipAddress: req.ip,
        });
      }
    });

    next();
  };
};
