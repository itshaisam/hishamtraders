import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class AuditController {
  /**
   * GET /api/v1/audit-logs
   * Paginated list with filters (Admin only — enforced by route middleware)
   */
  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const skip = (page - 1) * limit;

      const { userId, action, entityType, dateFrom, dateTo, search } = req.query;

      const where: Prisma.AuditLogWhereInput = {};

      if (userId && typeof userId === 'string') {
        where.userId = userId;
      }

      if (action && typeof action === 'string') {
        where.action = action;
      }

      if (entityType && typeof entityType === 'string') {
        where.entityType = { contains: entityType };
      }

      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom && typeof dateFrom === 'string') {
          where.timestamp.gte = new Date(dateFrom);
        }
        if (dateTo && typeof dateTo === 'string') {
          // Include the entire end day
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      if (search && typeof search === 'string') {
        where.notes = { contains: search };
      }

      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
