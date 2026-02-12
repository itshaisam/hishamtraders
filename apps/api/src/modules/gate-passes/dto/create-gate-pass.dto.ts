import { z } from 'zod';

export const createGatePassSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  date: z.coerce.date(),
  purpose: z.enum(['SALE', 'TRANSFER', 'RETURN', 'OTHER']),
  referenceType: z.enum(['PO', 'INVOICE', 'ADJUSTMENT', 'TRANSFER', 'CREDIT_NOTE']).optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    batchNo: z.string().optional(),
    binLocation: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    description: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

export type CreateGatePassDto = z.infer<typeof createGatePassSchema>;
