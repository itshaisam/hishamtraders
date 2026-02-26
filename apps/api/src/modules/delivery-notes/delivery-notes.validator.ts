import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
  salesOrderId: z.string().nullish(),
  clientId: z.string().min(1, 'Client is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  deliveryAddress: z.string().nullish(),
  driverName: z.string().nullish(),
  vehicleNo: z.string().nullish(),
  notes: z.string().nullish(),
  items: z.array(z.object({
    salesOrderItemId: z.string().nullish(),
    productId: z.string().min(1, 'Product is required'),
    productVariantId: z.string().nullish(),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
});

export const cancelDeliveryNoteSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
});
