import { z } from 'zod';

export const addGRNCostSchema = z.object({
  type: z.enum(['SHIPPING', 'CUSTOMS', 'TAX', 'OTHER'], {
    required_error: 'Cost type is required',
    invalid_type_error: 'Invalid cost type',
  }),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
});

export type AddGRNCostRequest = z.infer<typeof addGRNCostSchema>;
