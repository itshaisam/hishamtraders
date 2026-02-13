import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../utils/errors.js';
import ExcelJS from 'exceljs';

export class AuditController {
  /**
   * GET /api/v1/audit-logs
   * Paginated list with filters
   * Admin sees all; non-admin sees only own logs
   */
  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const skip = (page - 1) * limit;

      const { userId, action, entityType, entityId, ipAddress, dateFrom, dateTo, search } = req.query;
      const userRole = (req as any).user?.roleName || '';
      const currentUserId = (req as any).user?.userId;

      const where: Prisma.AuditLogWhereInput = {};

      // Authorization: Non-admins can only see their own logs
      if (userRole !== 'ADMIN') {
        where.userId = currentUserId;
      } else if (userId && typeof userId === 'string') {
        where.userId = userId;
      }

      if (action && typeof action === 'string') {
        where.action = action;
      }

      if (entityType && typeof entityType === 'string') {
        where.entityType = { contains: entityType };
      }

      if (entityId && typeof entityId === 'string') {
        where.entityId = { contains: entityId };
      }

      if (ipAddress && typeof ipAddress === 'string') {
        where.ipAddress = { contains: ipAddress };
      }

      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom && typeof dateFrom === 'string') {
          where.timestamp.gte = new Date(dateFrom);
        }
        if (dateTo && typeof dateTo === 'string') {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      // Search across entityId, user name, user email, notes
      if (search && typeof search === 'string') {
        where.OR = [
          { entityId: { contains: search } },
          { notes: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
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

      // Map items to include changedFieldsSummary
      const mappedItems = items.map((item) => ({
        id: item.id,
        userId: item.userId,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        timestamp: item.timestamp,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        notes: item.notes,
        changedFields: item.changedFields,
        changedFieldsSummary: item.changedFields && typeof item.changedFields === 'object' && !Array.isArray(item.changedFields)
          ? Object.keys(item.changedFields as Record<string, unknown>)
          : [],
        user: item.user,
      }));

      res.json({
        success: true,
        data: {
          items: mappedItems,
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

  /**
   * GET /api/v1/audit-logs/:id
   * Full detail for a single audit log entry
   */
  getAuditLogDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userRole = (req as any).user?.roleName || '';
      const currentUserId = (req as any).user?.userId;

      const log = await prisma.auditLog.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!log) {
        throw new NotFoundError('Audit log entry not found');
      }

      // Non-admins can only view their own logs
      if (userRole !== 'ADMIN' && log.userId !== currentUserId) {
        throw new NotFoundError('Audit log entry not found');
      }

      res.json({
        success: true,
        data: {
          id: log.id,
          userId: log.userId,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          changedFields: log.changedFields,
          notes: log.notes,
          user: log.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/audit-logs/export
   * Export audit logs to Excel (admin only)
   */
  exportAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, action, entityType, dateFrom, dateTo, search } = req.query;

      const where: Prisma.AuditLogWhereInput = {};

      if (userId && typeof userId === 'string') where.userId = userId;
      if (action && typeof action === 'string') where.action = action;
      if (entityType && typeof entityType === 'string') where.entityType = { contains: entityType };

      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom && typeof dateFrom === 'string') where.timestamp.gte = new Date(dateFrom);
        if (dateTo && typeof dateTo === 'string') {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { entityId: { contains: search } },
          { notes: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 5000, // Cap at 5000 rows for export
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Audit Logs');

      sheet.columns = [
        { header: 'Timestamp', key: 'timestamp', width: 22 },
        { header: 'User', key: 'userName', width: 20 },
        { header: 'Email', key: 'userEmail', width: 25 },
        { header: 'Action', key: 'action', width: 12 },
        { header: 'Entity Type', key: 'entityType', width: 18 },
        { header: 'Entity ID', key: 'entityId', width: 28 },
        { header: 'IP Address', key: 'ipAddress', width: 16 },
        { header: 'Changed Fields', key: 'changedFields', width: 40 },
        { header: 'Notes', key: 'notes', width: 40 },
      ];

      // Style header row
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };

      for (const log of logs) {
        const changedFieldsStr = log.changedFields && typeof log.changedFields === 'object' && !Array.isArray(log.changedFields)
          ? Object.keys(log.changedFields as Record<string, unknown>).join(', ')
          : '';

        sheet.addRow({
          timestamp: log.timestamp.toISOString().replace('T', ' ').slice(0, 19),
          userName: log.user.name,
          userEmail: log.user.email,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId || '',
          ipAddress: log.ipAddress || '',
          changedFields: changedFieldsStr,
          notes: log.notes || '',
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  };
}
