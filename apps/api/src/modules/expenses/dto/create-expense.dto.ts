import { z } from 'zod';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

export const createExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory, {
    errorMap: () => ({ message: 'Invalid expense category' }),
  }),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(500, 'Description must not exceed 500 characters'),
  date: z.coerce.date().refine((date) => date <= new Date(), {
    message: 'Date cannot be in the future',
  }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  receiptUrl: z.string().optional(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
