import { z } from 'zod';

export const purchaseOrderFilterSchema = z.object({
  search: z.string().optional().default(''),
  status: z.string()
    .optional()
    .transform(val => val === '' || val === undefined ? undefined : val)
    .pipe(z.enum(['PENDING', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']).optional()),
  supplierId: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PurchaseOrderFilters = z.infer<typeof purchaseOrderFilterSchema>;
