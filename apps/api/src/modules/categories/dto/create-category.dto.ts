import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
