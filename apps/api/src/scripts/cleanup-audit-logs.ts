import { prisma } from '../lib/prisma.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cleanup audit logs older than retention period
 * Run this as a cron job (e.g., daily)
 */
async function cleanupOldAuditLogs() {
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '730', 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  console.log(`🧹 Cleaning up audit logs older than ${cutoffDate.toISOString()}`);

  const result = await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`✅ Deleted ${result.count} old audit log entries`);
}

cleanupOldAuditLogs()
  .catch((error) => {
    console.error('❌ Audit cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
