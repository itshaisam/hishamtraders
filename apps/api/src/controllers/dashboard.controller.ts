import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { AuthRequest } from '../types/auth.types.js';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getAdminStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getAdminStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getWarehouseStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getWarehouseStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getSalesStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getSalesStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getAccountantStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getAccountantStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getRecoveryStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getRecoveryStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
