import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().optional(), // Optional: auto-generated if not provided
  name: z.string().min(1, 'Product name is required').min(2, 'Name must be at least 2 characters'),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Cost price must be positive')),
  sellingPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Selling price must be positive')),
  reorderLevel: z.string().or(z.number()).pipe(z.coerce.number().int().default(10)),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  hasExpiry: z.boolean().default(false),
  shelfLifeDays: z.string().or(z.number()).pipe(z.coerce.number().int().positive()).optional().nullable(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
