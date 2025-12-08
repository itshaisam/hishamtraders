import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').min(2, 'Name must be at least 2 characters'),
  location: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateWarehouseDto = z.infer<typeof createWarehouseSchema>;
