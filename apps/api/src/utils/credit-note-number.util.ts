import { format } from 'date-fns';

/**
 * Generate next credit note number in format CN-YYYYMMDD-XXX
 * Example: CN-20251224-001, CN-20251224-002, etc.
 *
 * Sequence resets daily (XXX starts from 001 each day)
 */
export async function generateCreditNoteNumber(prisma: any): Promise<string> {
  const today = new Date();
  const dateStr = format(today, 'yyyyMMdd');
  const prefix = `CN-${dateStr}-`;

  // Find the latest credit note for today
  const latestCN = await prisma.creditNote.findFirst({
    where: {
      creditNoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      creditNoteNumber: 'desc',
    },
  });

  if (!latestCN) {
    return `${prefix}001`;
  }

  // Extract sequence number and increment
  const lastSequence = latestCN.creditNoteNumber.split('-')[2];
  const nextSequence = parseInt(lastSequence, 10) + 1;
  const paddedSequence = nextSequence.toString().padStart(3, '0');

  return `${prefix}${paddedSequence}`;
}
