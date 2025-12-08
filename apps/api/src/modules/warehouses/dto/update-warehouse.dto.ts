import { z } from 'zod';

export const updateWarehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type UpdateWarehouseDto = z.infer<typeof updateWarehouseSchema>;
