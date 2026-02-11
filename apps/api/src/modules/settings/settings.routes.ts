import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new SettingsController();

// All settings routes require authentication
router.use(authenticate);

// Tax rate settings
router.get('/tax-rate', controller.getTaxRate);
router.put('/tax-rate', controller.updateTaxRate); // Admin only

// Currency symbol settings
router.get('/currency-symbol', controller.getCurrencySymbol);
router.put('/currency-symbol', controller.updateCurrencySymbol); // Admin only

export { router as settingsRoutes };
