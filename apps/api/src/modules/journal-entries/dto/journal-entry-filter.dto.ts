import { z } from 'zod';
import { JournalEntryStatus } from '@prisma/client';

export const journalEntryFilterSchema = z.object({
  status: z.nativeEnum(JournalEntryStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type JournalEntryFilters = z.infer<typeof journalEntryFilterSchema>;
