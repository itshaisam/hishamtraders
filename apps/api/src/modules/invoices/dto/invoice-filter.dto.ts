import { z } from 'zod';

export const invoiceFilterSchema = z.object({
  clientId: z.string().optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  startDate: z.string().or(z.date()).optional().transform((val) => val ? (typeof val === 'string' ? new Date(val) : val) : undefined),
  endDate: z.string().or(z.date()).optional().transform((val) => val ? (typeof val === 'string' ? new Date(val) : val) : undefined),
  search: z.string().optional(), // Search by invoice number
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type InvoiceFilterDto = z.infer<typeof invoiceFilterSchema>;
