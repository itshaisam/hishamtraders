import { z } from 'zod';

export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
});

export type SupplierFilterDto = z.infer<typeof supplierFilterSchema>;
