import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';

export const expenseFilterSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ExpenseFilterDto = z.infer<typeof expenseFilterSchema>;
