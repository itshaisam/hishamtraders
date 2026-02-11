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

// Company settings
router.get('/company-name', controller.getCompanyName);
router.put('/company-name', controller.updateCompanyName); // Admin only
router.get('/company-logo', controller.getCompanyLogo);
router.put('/company-logo', controller.updateCompanyLogo); // Admin only

export { router as settingsRoutes };
