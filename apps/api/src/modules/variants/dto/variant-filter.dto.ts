import { z } from 'zod';

export const variantFilterSchema = z.object({
  productId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  search: z.string().optional(), // Search in variantName or SKU
  page: z.string().or(z.number()).pipe(z.coerce.number().int().positive().default(1)).optional(),
  limit: z.string().or(z.number()).pipe(z.coerce.number().int().positive().max(100).default(20)).optional(),
});

export type VariantFilterDto = z.infer<typeof variantFilterSchema>;
