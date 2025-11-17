import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { countriesController } from './countries.controller';

const router = Router();

// GET /api/countries - List all active countries (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => countriesController.getAll(req, res, next)
);

// GET /api/countries/:id - Get country details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => countriesController.getById(req, res, next)
);

export default router;
