import { z } from 'zod';

export const createVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().optional(), // Auto-generated if not provided
  variantName: z.string().min(1, 'Variant name is required').min(2, 'Name must be at least 2 characters'),
  attributes: z.record(z.string(), z.string()).refine(
    (attrs) => Object.keys(attrs).length > 0,
    { message: 'At least one attribute is required' }
  ),
  costPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Cost price must be positive')),
  sellingPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Selling price must be positive')),
  reorderLevel: z.string().or(z.number()).pipe(z.coerce.number().int().nonnegative().default(10)),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type CreateVariantDto = z.infer<typeof createVariantSchema>;
