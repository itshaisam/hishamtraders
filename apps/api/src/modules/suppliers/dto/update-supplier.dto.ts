import { z } from 'zod';

export const updateSupplierSchema = z.object({
  countryId: z.string().optional(), // Changed from 'country: string'
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTermId: z.string().optional(), // Changed from 'paymentTerms: string'
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
