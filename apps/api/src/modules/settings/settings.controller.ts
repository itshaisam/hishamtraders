import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { SettingsService } from './settings.service.js';
import { BadRequestError, ForbiddenError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

const prisma = new PrismaClient();

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService(prisma);
  }

  /**
   * GET /api/settings/tax-rate
   * Get current tax rate
   */
  getTaxRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taxRate = await this.settingsService.getTaxRate();

      res.json({
        success: true,
        data: { taxRate },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/settings/tax-rate
   * Update tax rate (Admin only)
   */
  updateTaxRate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is Admin
      const user = await prisma.user.findUnique({
        where: { id: req.user?.userId! },
        include: { role: true },
      });

      if (!user || user.role.name !== 'ADMIN') {
        throw new ForbiddenError('Only Admin users can update tax rate');
      }

      const { taxRate } = req.body;

      // Validate tax rate
      if (typeof taxRate !== 'number') {
        throw new BadRequestError('Tax rate must be a number');
      }

      if (taxRate < 0 || taxRate > 100) {
        throw new BadRequestError('Tax rate must be between 0 and 100');
      }

      // Get old value before update
      const oldTaxRate = await this.settingsService.getTaxRate();

      // Update setting
      await this.settingsService.updateSetting('TAX_RATE', taxRate.toString());

      // Audit log
      await AuditService.log({
        userId: req.user?.userId!,
        action: 'UPDATE',
        entityType: 'SystemSetting',
        entityId: 'TAX_RATE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        changedFields: {
          taxRate: { old: oldTaxRate, new: taxRate },
        },
        notes: `Tax rate changed from ${oldTaxRate}% to ${taxRate}% by ${user.name}`,
      });

      logger.info(`Tax rate updated to ${taxRate}%`, {
        userId: req.user?.userId,
        userName: user.name,
      });

      res.json({
        success: true,
        message: `Tax rate updated to ${taxRate}%`,
        data: { taxRate },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/settings/currency-symbol
   * Get current currency symbol
   */
  getCurrencySymbol = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currencySymbol = await this.settingsService.getCurrencySymbol();

      res.json({
        success: true,
        data: { currencySymbol },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/settings/currency-symbol
   * Update currency symbol (Admin only)
   */
  updateCurrencySymbol = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.userId! },
        include: { role: true },
      });

      if (!user || user.role.name !== 'ADMIN') {
        throw new ForbiddenError('Only Admin users can update currency symbol');
      }

      const { currencySymbol } = req.body;

      if (typeof currencySymbol !== 'string' || currencySymbol.trim().length === 0) {
        throw new BadRequestError('Currency symbol must be a non-empty string');
      }

      if (currencySymbol.trim().length > 10) {
        throw new BadRequestError('Currency symbol must be at most 10 characters');
      }

      const trimmed = currencySymbol.trim();
      const oldSymbol = await this.settingsService.getCurrencySymbol();

      await this.settingsService.upsertSetting('CURRENCY_SYMBOL', trimmed, 'Currency Symbol', 'string', 'general');

      await AuditService.log({
        userId: req.user?.userId!,
        action: 'UPDATE',
        entityType: 'SystemSetting',
        entityId: 'CURRENCY_SYMBOL',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        changedFields: {
          currencySymbol: { old: oldSymbol, new: trimmed },
        },
        notes: `Currency symbol changed from "${oldSymbol}" to "${trimmed}" by ${user.name}`,
      });

      logger.info(`Currency symbol updated to "${trimmed}"`, {
        userId: req.user?.userId,
        userName: user.name,
      });

      res.json({
        success: true,
        message: `Currency symbol updated to "${trimmed}"`,
        data: { currencySymbol: trimmed },
      });
    } catch (error) {
      next(error);
    }
  };
}
