import { Request, Response, NextFunction } from 'express';
import { changeHistoryService } from '../../services/change-history.service.js';
import { BadRequestError } from '../../utils/errors.js';

export class ChangeHistoryController {
  /**
   * GET /api/v1/change-history/:entityType/:entityId
   * Returns version history for a specific entity
   */
  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;

      const history = await changeHistoryService.getHistory(entityType, entityId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/change-history/:entityType/:entityId/can-rollback
   * Validates whether rollback is safe for a given entity
   */
  canRollback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;
      const result = await changeHistoryService.canRollback(entityType, entityId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/change-history/rollback
   * Performs a rollback operation
   */
  rollback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId, targetVersion, reason } = req.body;

      if (!entityType || !entityId || targetVersion === undefined || !reason) {
        throw new BadRequestError('entityType, entityId, targetVersion, and reason are required');
      }

      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new BadRequestError('User context required');
      }

      const result = await changeHistoryService.rollbackToVersion(
        entityType,
        entityId,
        Number(targetVersion),
        reason,
        userId
      );

      res.json({
        success: true,
        message: `Rolled back to version ${targetVersion}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
