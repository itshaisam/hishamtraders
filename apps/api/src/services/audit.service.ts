import { prisma, getTenantId } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'PERMISSION_CHECK';
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  changedFields?: Prisma.InputJsonValue;
  notes?: string;
}

export class AuditService {
  // Sensitive fields that should never be logged
  private static SENSITIVE_FIELDS = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'creditCard',
  ];

  /**
   * Create audit log entry asynchronously
   * Errors are logged but don't throw to prevent breaking main flow
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Remove sensitive fields from changedFields
      const sanitizedChangedFields = data.changedFields
        ? this.sanitizeChangedFields(data.changedFields)
        : undefined;

      await prisma.auditLog.create({
        data: {
          tenantId: getTenantId(),
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          timestamp: new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          changedFields: sanitizedChangedFields as Prisma.InputJsonValue,
          notes: data.notes,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit failure shouldn't break app
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Remove sensitive fields from changed fields object
   */
  private static sanitizeChangedFields(
    changedFields: Prisma.InputJsonValue
  ): Prisma.InputJsonValue {
    if (typeof changedFields !== 'object' || changedFields === null || Array.isArray(changedFields)) {
      return changedFields;
    }

    const sanitized: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, value] of Object.entries(changedFields as Record<string, Prisma.InputJsonValue>)) {
      // Check if field name contains sensitive keywords
      const isSensitive = this.SENSITIVE_FIELDS.some((sensitiveField) =>
        key.toLowerCase().includes(sensitiveField.toLowerCase())
      );

      if (!isSensitive) {
        sanitized[key] = value;
      } else {
        sanitized[key] = { old: '[REDACTED]', new: '[REDACTED]' };
      }
    }

    return sanitized as Prisma.InputJsonValue;
  }

  /**
   * Extract changed fields by comparing old and new data
   */
  static extractChangedFields(
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown>
  ): Prisma.InputJsonValue | undefined {
    if (!oldData) return undefined;

    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    }

    return Object.keys(changes).length > 0 ? (changes as Prisma.InputJsonValue) : undefined;
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent audit logs for all entities
   */
  static async getRecentAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }
}
