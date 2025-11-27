import { z } from 'zod';

export const updateUomSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  abbreviation: z.string().min(1).max(10, 'Abbreviation must be 10 characters or less').optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export type UpdateUomDto = z.infer<typeof updateUomSchema>;
