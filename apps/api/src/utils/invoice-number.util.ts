import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

/**
 * Generate next invoice number in format INV-YYYYMMDD-XXX
 * Example: INV-20251224-001, INV-20251224-002, etc.
 *
 * Sequence resets daily (XXX starts from 001 each day)
 */
export async function generateInvoiceNumber(prisma: PrismaClient): Promise<string> {
  const today = new Date();
  const dateStr = format(today, 'yyyyMMdd'); // e.g., "20251224"
  const prefix = `INV-${dateStr}-`;

  // Find the latest invoice for today
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  if (!latestInvoice) {
    // First invoice of the day
    return `${prefix}001`;
  }

  // Extract sequence number and increment
  const lastSequence = latestInvoice.invoiceNumber.split('-')[2];
  const nextSequence = parseInt(lastSequence, 10) + 1;

  // Pad with zeros to maintain 3-digit format
  const paddedSequence = nextSequence.toString().padStart(3, '0');

  return `${prefix}${paddedSequence}`;
}
