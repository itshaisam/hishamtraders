import { z } from 'zod';

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
