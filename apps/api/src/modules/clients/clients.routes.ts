import { Router } from 'express';
import { ClientController } from './clients.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';

const router = Router();
const controller = new ClientController();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/clients/cities - Get all distinct cities
router.get('/cities', controller.getAllCities);

// GET /api/v1/clients - Get all clients (all authenticated users)
router.get('/', controller.getClients);

// GET /api/v1/clients/:id - Get client by ID (all authenticated users)
router.get('/:id', controller.getClientById);

// POST /api/v1/clients - Create new client (SALES_OFFICER, ACCOUNTANT, ADMIN)
router.post(
  '/',
  requireRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']),
  controller.createClient
);

// PUT /api/v1/clients/:id - Update client (SALES_OFFICER, ACCOUNTANT, ADMIN)
router.put(
  '/:id',
  requireRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']),
  controller.updateClient
);

// DELETE /api/v1/clients/:id - Soft delete client (SALES_OFFICER, ACCOUNTANT, ADMIN)
router.delete(
  '/:id',
  requireRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']),
  controller.deleteClient
);

export { router as clientRoutes };
