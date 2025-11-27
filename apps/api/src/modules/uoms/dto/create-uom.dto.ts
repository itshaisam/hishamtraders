import { z } from 'zod';

export const createUomSchema = z.object({
  name: z.string().min(1, 'UOM name is required').min(2, 'Name must be at least 2 characters'),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(10, 'Abbreviation must be 10 characters or less'),
  description: z.string().optional(),
});

export type CreateUomDto = z.infer<typeof createUomSchema>;
