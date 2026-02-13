import { Request, Response, NextFunction } from 'express';
import { alertService } from './alert.service.js';
import { AuthRequest } from '../../types/auth.types.js';

export class AlertController {
  /**
   * GET /api/v1/alerts
   * Get alerts for the authenticated user. Optional query: acknowledged (true/false).
   */
  getAlerts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.roleName || 'UNKNOWN';

      let acknowledged: boolean | undefined;
      if (req.query.acknowledged === 'true') {
        acknowledged = true;
      } else if (req.query.acknowledged === 'false') {
        acknowledged = false;
      }

      const data = await alertService.getUserAlerts(userId, role, acknowledged);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/alerts/:id/acknowledge
   * Acknowledge a specific alert.
   */
  acknowledgeAlert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const data = await alertService.acknowledgeAlert(id, userId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/alerts/overdue-clients
   * Get clients with overdue invoices.
   */
  getOverdueClients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await alertService.getOverdueClients();

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/alerts/check-overdue
   * Trigger overdue payment check (admin manual trigger).
   */
  checkOverdue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await alertService.checkOverduePayments();

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/alerts/unread-count
   * Get count of unacknowledged alerts for the authenticated user.
   */
  getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.roleName || 'UNKNOWN';

      const data = await alertService.getUnacknowledgedCount(userId, role);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
