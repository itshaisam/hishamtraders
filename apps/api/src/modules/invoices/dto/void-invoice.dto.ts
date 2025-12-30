import { z } from 'zod';

/**
 * Validation schema for voiding an invoice
 * Story 3.4: Invoice Voiding and Stock Reversal
 */
export const voidInvoiceSchema = z.object({
  reason: z
    .string()
    .min(10, 'Void reason must be at least 10 characters')
    .max(500, 'Void reason must not exceed 500 characters'),
});

export type VoidInvoiceDto = z.infer<typeof voidInvoiceSchema>;
