import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';
import { AlertType, AlertPriority, AlertAction, PromiseStatus, InvoiceStatus } from '@prisma/client';

class AlertService {
  /**
   * Get alerts for a user based on their role.
   * ADMIN sees all alerts; others see alerts targeted to their userId or role.
   */
  async getUserAlerts(userId: string, role: string, acknowledged?: boolean) {
    const where: any = {};

    // If not admin, filter by targetUserId or targetRole
    if (role !== 'ADMIN') {
      where.OR = [
        { targetUserId: userId },
        { targetRole: role },
      ];
    }

    // Optional acknowledged filter
    if (acknowledged !== undefined) {
      where.acknowledged = acknowledged;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        targetUser: {
          select: { id: true, name: true, email: true },
        },
        acknowledger: {
          select: { id: true, name: true },
        },
      },
    });

    return alerts;
  }

  /**
   * Acknowledge an alert by setting acknowledged=true with user info.
   */
  async acknowledgeAlert(id: string, userId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get clients with overdue invoices (balance > 0 and at least one overdue invoice).
   * Returns client info, oldest overdue invoice date, total overdue amount, and days overdue.
   */
  async getOverdueClients() {
    const now = new Date();

    const clients = await prisma.client.findMany({
      where: {
        balance: { gt: 0 },
        invoices: {
          some: {
            status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
            dueDate: { lt: now },
          },
        },
      },
      include: {
        invoices: {
          where: {
            status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
            dueDate: { lt: now },
          },
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            paidAmount: true,
            dueDate: true,
            status: true,
          },
        },
        recoveryAgent: {
          select: { id: true, name: true },
        },
      },
    });

    return clients.map((client) => {
      const overdueInvoices = client.invoices;
      const oldestDueDate = overdueInvoices.length > 0 ? overdueInvoices[0].dueDate : null;
      const totalOverdueAmount = overdueInvoices.reduce(
        (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
        0
      );
      const daysOverdue = oldestDueDate
        ? Math.floor((now.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: client.id,
        name: client.name,
        contactPerson: client.contactPerson,
        phone: client.phone,
        city: client.city,
        area: client.area,
        balance: client.balance,
        creditLimit: client.creditLimit,
        recoveryAgent: client.recoveryAgent,
        oldestDueDate,
        totalOverdueAmount,
        daysOverdue,
        overdueInvoiceCount: overdueInvoices.length,
      };
    });
  }

  /**
   * Main job logic: check for overdue payments and broken promises.
   * Creates alerts for clients matching alert rules, and marks broken promises.
   */
  async checkOverduePayments() {
    const now = new Date();
    let alertsCreated = 0;
    let promisesMarkedBroken = 0;

    // --- Part 1: Overdue payment alerts based on alert rules ---
    const rules = await prisma.alertRule.findMany({
      where: { isActive: true },
      orderBy: { daysOverdue: 'asc' },
    });

    for (const rule of rules) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rule.daysOverdue);

      // Find clients with invoices overdue by at least rule.daysOverdue days
      const clients = await prisma.client.findMany({
        where: {
          balance: { gt: 0 },
          invoices: {
            some: {
              status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
              dueDate: { lt: cutoffDate },
            },
          },
        },
        include: {
          invoices: {
            where: {
              status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
              dueDate: { lt: cutoffDate },
            },
            select: {
              total: true,
              paidAmount: true,
              dueDate: true,
            },
            orderBy: { dueDate: 'asc' },
            take: 1,
          },
        },
      });

      const targetRoles = rule.targetRoles as string[];

      for (const client of clients) {
        // For each target role, check if alert already exists
        for (const targetRole of targetRoles) {
          const existingAlert = await prisma.alert.findFirst({
            where: {
              type: AlertType.CLIENT_OVERDUE,
              relatedType: 'Client',
              relatedId: client.id,
              targetRole,
              acknowledged: false,
            },
          });

          if (!existingAlert) {
            const oldestInvoice = client.invoices[0];
            const daysOverdue = oldestInvoice
              ? Math.floor((now.getTime() - oldestInvoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
              : rule.daysOverdue;
            const overdueAmount = client.invoices.reduce(
              (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
              0
            );

            await prisma.alert.create({
              data: {
                type: AlertType.CLIENT_OVERDUE,
                priority: rule.priority,
                message: `Client "${client.name}" has overdue payments of Rs. ${overdueAmount.toLocaleString()} (${daysOverdue} days overdue). Rule: ${rule.name}`,
                relatedType: 'Client',
                relatedId: client.id,
                targetRole,
              },
            });

            alertsCreated++;
          }
        }
      }
    }

    // --- Part 2: Broken promise detection ---
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const brokenPromises = await prisma.paymentPromise.findMany({
      where: {
        status: PromiseStatus.PENDING,
        promiseDate: { lt: yesterday },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    for (const promise of brokenPromises) {
      // Mark promise as BROKEN
      await prisma.paymentPromise.update({
        where: { id: promise.id },
        data: { status: PromiseStatus.BROKEN },
      });

      promisesMarkedBroken++;

      // Check if alert already exists for this promise
      const existingAlert = await prisma.alert.findFirst({
        where: {
          type: AlertType.PROMISE_BROKEN,
          relatedType: 'PaymentPromise',
          relatedId: promise.id,
          acknowledged: false,
        },
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            type: AlertType.PROMISE_BROKEN,
            priority: AlertPriority.HIGH,
            message: `Payment promise by "${promise.client.name}" for Rs. ${Number(promise.promiseAmount).toLocaleString()} (due ${promise.promiseDate.toISOString().split('T')[0]}) was broken.`,
            relatedType: 'PaymentPromise',
            relatedId: promise.id,
            targetRole: 'RECOVERY_AGENT',
          },
        });

        alertsCreated++;
      }
    }

    logger.info(`Overdue check completed: ${alertsCreated} alerts created, ${promisesMarkedBroken} promises marked broken`);

    return {
      alertsCreated,
      promisesMarkedBroken,
    };
  }

  /**
   * Seed default alert rules if they don't exist (upsert by name).
   */
  async seedDefaultAlertRules() {
    const defaults = [
      {
        name: '7 Day Overdue',
        daysOverdue: 7,
        priority: AlertPriority.LOW,
        targetRoles: ['RECOVERY_AGENT'],
        action: AlertAction.NOTIFY,
      },
      {
        name: '14 Day Overdue',
        daysOverdue: 14,
        priority: AlertPriority.MEDIUM,
        targetRoles: ['RECOVERY_AGENT', 'ACCOUNTANT'],
        action: AlertAction.NOTIFY,
      },
      {
        name: '30 Day Overdue',
        daysOverdue: 30,
        priority: AlertPriority.HIGH,
        targetRoles: ['RECOVERY_AGENT', 'ACCOUNTANT', 'ADMIN'],
        action: AlertAction.NOTIFY,
      },
      {
        name: '60 Day Overdue',
        daysOverdue: 60,
        priority: AlertPriority.CRITICAL,
        targetRoles: ['ADMIN'],
        action: AlertAction.NOTIFY,
      },
    ];

    const results = [];

    for (const rule of defaults) {
      const upserted = await prisma.alertRule.upsert({
        where: { name: rule.name },
        update: {
          daysOverdue: rule.daysOverdue,
          priority: rule.priority,
          targetRoles: rule.targetRoles,
          action: rule.action,
        },
        create: {
          name: rule.name,
          daysOverdue: rule.daysOverdue,
          priority: rule.priority,
          targetRoles: rule.targetRoles,
          action: rule.action,
        },
      });

      results.push(upserted);
    }

    logger.info(`Seeded ${results.length} default alert rules`);
    return results;
  }

  /**
   * Count unacknowledged alerts for a user/role.
   */
  async getUnacknowledgedCount(userId: string, role: string) {
    const where: any = {
      acknowledged: false,
    };

    if (role !== 'ADMIN') {
      where.OR = [
        { targetUserId: userId },
        { targetRole: role },
      ];
    }

    const count = await prisma.alert.count({ where });

    return { count };
  }
}

export const alertService = new AlertService();
