import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').min(2, 'Name must be at least 2 characters'),
  country: z.string().optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
