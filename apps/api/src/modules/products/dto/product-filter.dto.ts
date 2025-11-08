import { z } from 'zod';

export const productFilterSchema = z.object({
  search: z.string().optional(), // Search by SKU or name
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('10'),
});

export type ProductFilterDto = z.infer<typeof productFilterSchema>;
