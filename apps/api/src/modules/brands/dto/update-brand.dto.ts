import { z } from 'zod';

export const updateBrandSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  country: z.string().optional(),
  active: z.boolean().optional(),
});

export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
