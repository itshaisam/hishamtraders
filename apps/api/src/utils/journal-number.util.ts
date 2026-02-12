import { prisma } from '../lib/prisma.js';

/**
 * Generate next journal entry number in format: JE-YYYYMMDD-XXX
 */
export async function generateJournalEntryNumber(date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const prefix = `JE-${dateStr}-`;

  // Find the latest entry with this date prefix
  const latestEntry = await prisma.journalEntry.findFirst({
    where: {
      entryNumber: { startsWith: prefix },
    },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });

  let nextSequence = 1;
  if (latestEntry) {
    const parts = latestEntry.entryNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1], 10);
    nextSequence = lastNumber + 1;
  }

  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}
