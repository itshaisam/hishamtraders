import { prisma } from '../lib/prisma.js';
import { BadRequestError } from './errors.js';

/**
 * Validates that a transaction date is not in a closed period.
 * Call this before creating invoices, payments, expenses, credit notes, etc.
 */
export async function validatePeriodNotClosed(date: Date): Promise<void> {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  lastDayOfMonth.setHours(0, 0, 0, 0);

  const closedPeriod = await prisma.periodClose.findFirst({
    where: {
      periodDate: lastDayOfMonth,
      status: 'CLOSED',
    },
  });

  if (closedPeriod) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[date.getMonth()];
    throw new BadRequestError(
      `Cannot create transaction: period ${monthName} ${date.getFullYear()} is closed`
    );
  }
}
