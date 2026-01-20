import { z } from 'zod';
import { createExpenseSchema } from './create-expense.dto.js';

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
