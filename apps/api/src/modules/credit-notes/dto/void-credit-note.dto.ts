import { z } from 'zod';

export const voidCreditNoteSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type VoidCreditNoteDto = z.infer<typeof voidCreditNoteSchema>;
