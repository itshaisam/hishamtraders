import { z } from 'zod';

const journalEntryLineSchema = z.object({
  accountHeadId: z.string().min(1, 'Account is required'),
  debitAmount: z.number().min(0, 'Debit must be >= 0').default(0),
  creditAmount: z.number().min(0, 'Credit must be >= 0').default(0),
  description: z.string().max(500).optional().nullable(),
});

export const createJournalEntrySchema = z.object({
  date: z.coerce.date(),
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must not exceed 500 characters'),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  lines: z
    .array(journalEntryLineSchema)
    .min(2, 'Journal entry must have at least 2 lines'),
});

export type CreateJournalEntryDto = z.infer<typeof createJournalEntrySchema>;
