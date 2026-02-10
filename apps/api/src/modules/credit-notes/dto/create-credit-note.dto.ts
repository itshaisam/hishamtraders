import { z } from 'zod';

export const createCreditNoteSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  items: z
    .array(
      z.object({
        invoiceItemId: z.string().min(1, 'Invoice item ID is required'),
        quantityReturned: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
});

export type CreateCreditNoteDto = z.infer<typeof createCreditNoteSchema>;
