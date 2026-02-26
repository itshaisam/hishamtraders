import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  clientId: z.string().min(1),
  warehouseId: z.string().min(1),
  paymentType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    productVariantId: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).max(100).default(0),
  })).min(1),
});

export const cancelSalesOrderSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
});
