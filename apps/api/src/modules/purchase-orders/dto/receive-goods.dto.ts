import { z } from 'zod';

const receiveGoodsItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productVariantId: z.string().min(1, 'Variant ID is required').optional().nullable(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  binLocation: z.string().optional().nullable(),
  batchNo: z.string().optional().nullable(),
});

export const receiveGoodsSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  receivedDate: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .pipe(z.date())
    .optional(),
  items: z.array(receiveGoodsItemSchema).min(1, 'At least one item is required'),
});

export type ReceiveGoodsDto = z.infer<typeof receiveGoodsSchema>;
export type ReceiveGoodsItemDto = z.infer<typeof receiveGoodsItemSchema>;
