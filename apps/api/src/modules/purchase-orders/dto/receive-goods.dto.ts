import { z } from 'zod';

const receiveGoodsItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  productVariantId: z.string().cuid('Invalid variant ID').optional().nullable(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  binLocation: z.string().optional().nullable(),
  batchNo: z.string().optional().nullable(),
});

export const receiveGoodsSchema = z.object({
  warehouseId: z.string().cuid('Invalid warehouse ID'),
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
