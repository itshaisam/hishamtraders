import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').min(2, 'Name must be at least 2 characters'),
  countryId: z.string().optional(), // Changed from 'country: string'
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTermId: z.string().optional(), // Changed from 'paymentTerms: string'
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
