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
}
