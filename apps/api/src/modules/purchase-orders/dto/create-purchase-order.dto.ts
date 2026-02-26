import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string()
    .or(z.date())
    .transform(val => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    })
    .pipe(z.date()),
  expectedArrivalDate: z.string()
    .or(z.date())
    .transform(val => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    })
    .pipe(z.date())
    .optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    productVariantId: z.string().optional(), // Optional: for products with variants
    quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be positive'),
    unitCost: z.number().positive('Unit cost must be positive'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(), // Override purchase tax rate (defaults to system setting)
});

export type CreatePurchaseOrderRequest = z.infer<typeof createPurchaseOrderSchema>;

export interface POItemInput {
  productId: string;
  productVariantId?: string; // Optional: for products with variants
  quantity: number;
  unitCost: number;
}
