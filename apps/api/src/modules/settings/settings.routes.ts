import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new SettingsController();

// Public routes (no auth needed — used on login page)
router.get('/company-name', controller.getCompanyName);

// All remaining settings routes require authentication
router.use(authenticate);

// Tax rate settings
router.get('/tax-rate', controller.getTaxRate);
router.put('/tax-rate', controller.updateTaxRate); // Admin only

// Purchase tax rate settings
router.get('/purchase-tax-rate', controller.getPurchaseTaxRate);
router.put('/purchase-tax-rate', controller.updatePurchaseTaxRate); // Admin only

// Currency symbol settings
router.get('/currency-symbol', controller.getCurrencySymbol);
router.put('/currency-symbol', controller.updateCurrencySymbol); // Admin only

// Company settings
router.put('/company-name', controller.updateCompanyName); // Admin only
router.get('/company-logo', controller.getCompanyLogo);
router.put('/company-logo', controller.updateCompanyLogo); // Admin only

// Workflow settings (Story 10.10)
router.get('/workflow', controller.getWorkflowSettings);
router.put('/workflow', controller.updateWorkflowSetting); // Admin only

export { router as settingsRoutes };
