import { Request, Response, NextFunction } from 'express';
import { recoveryService } from './recovery.service.js';
import { recoveryDashboardService } from './recovery-dashboard.service.js';
import { AgentPerformanceService } from '../reports/agent-performance.service.js';
import logger from '../../lib/logger.js';

const agentPerformanceService = new AgentPerformanceService();

export class RecoveryController {
  getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.query;
      const result = await recoveryService.getSchedule(date as string | undefined);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getTodayRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.roleName || '';
      const result = await recoveryService.getTodayRoute(userId, role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getRecoveryAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await recoveryService.getRecoveryAgents();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  createVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await recoveryService.createVisit(req.body, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId, page, limit } = req.query;
      if (!clientId) {
        res.status(400).json({ success: false, error: 'clientId is required' });
        return;
      }
      const result = await recoveryService.getVisitHistory(
        clientId as string,
        page ? parseInt(page as string, 10) : undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getMyVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { dateFrom, dateTo } = req.query;
      const result = await recoveryService.getMyVisits(
        userId,
        dateFrom as string | undefined,
        dateTo as string | undefined
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  createPromise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const result = await recoveryService.createPromise(req.body, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  fulfillPromise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const result = await recoveryService.fulfillPromise(id, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  cancelPromise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const result = await recoveryService.cancelPromise(id, userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getDuePromises = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.roleName || '';
      const result = await recoveryService.getDuePromises(userId, role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getClientPromises = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId } = req.query;
      const result = await recoveryService.getClientPromises(clientId as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getPromiseFulfillmentRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { agentId, dateFrom, dateTo } = req.query;
      const result = await recoveryService.getPromiseFulfillmentRate(
        agentId as string | undefined,
        dateFrom as string | undefined,
        dateTo as string | undefined
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const role = req.user!.roleName || '';
      const result = await recoveryDashboardService.getRecoveryDashboard(userId, role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getAllAgentsPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dateFrom, dateTo } = req.query;
      const result = await agentPerformanceService.getAllAgentsPerformance(
        dateFrom as string | undefined,
        dateTo as string | undefined
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getAgentPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { dateFrom, dateTo } = req.query;
      const result = await agentPerformanceService.getAgentPerformance(
        id,
        dateFrom as string | undefined,
        dateTo as string | undefined
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
