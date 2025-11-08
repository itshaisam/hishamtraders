import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().datetime('Invalid date format').or(z.date()).pipe(
    z.coerce.date()
  ),
  expectedArrivalDate: z.string().datetime('Invalid date format')
    .or(z.date())
    .pipe(z.coerce.date())
    .optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive'),
    unitCost: z.number().positive('Unit cost must be positive'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export type CreatePurchaseOrderRequest = z.infer<typeof createPurchaseOrderSchema>;

export interface POItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}
