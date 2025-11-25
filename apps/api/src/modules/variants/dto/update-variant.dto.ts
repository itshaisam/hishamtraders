import { z } from 'zod';

export const updateVariantSchema = z.object({
  variantName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  attributes: z.record(z.string(), z.string()).refine(
    (attrs) => Object.keys(attrs).length > 0,
    { message: 'At least one attribute is required' }
  ).optional(),
  costPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Cost price must be positive')).optional(),
  sellingPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Selling price must be positive')).optional(),
  reorderLevel: z.string().or(z.number()).pipe(z.coerce.number().int().nonnegative()).optional(),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type UpdateVariantDto = z.infer<typeof updateVariantSchema>;
