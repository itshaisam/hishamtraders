import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { paymentTermsController } from './payment-terms.controller.js';

const router = Router();

// GET /api/payment-terms - List all active payment terms (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => paymentTermsController.getAll(req, res, next)
);

// GET /api/payment-terms/:id - Get payment term details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => paymentTermsController.getById(req, res, next)
);

export default router;
