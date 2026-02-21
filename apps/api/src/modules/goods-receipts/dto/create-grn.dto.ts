import { z } from 'zod';

const grnItemSchema = z.object({
  poItemId: z.string().min(1, 'PO Item ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  productVariantId: z.string().min(1).optional().nullable(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  binLocation: z.string().optional().nullable(),
  batchNo: z.string().optional().nullable(),
});

export const createGRNSchema = z.object({
  poId: z.string().min(1, 'Purchase Order ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  receivedDate: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .pipe(z.date())
    .optional(),
  notes: z.string().optional().nullable(),
  items: z.array(grnItemSchema).min(1, 'At least one item is required'),
});

export type CreateGRNDto = z.infer<typeof createGRNSchema>;
export type CreateGRNItemDto = z.infer<typeof grnItemSchema>;
