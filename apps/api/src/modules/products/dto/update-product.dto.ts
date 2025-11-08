import { z } from 'zod';

export const updateProductSchema = z.object({
  brand: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Cost price must be positive')).optional(),
  sellingPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Selling price must be positive')).optional(),
  reorderLevel: z.string().or(z.number()).pipe(z.coerce.number().int()).optional(),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type UpdateProductDto = z.infer<typeof updateProductSchema>;
