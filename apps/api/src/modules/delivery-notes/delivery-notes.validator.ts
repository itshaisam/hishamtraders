import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
  salesOrderId: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  deliveryAddress: z.string().optional(),
  driverName: z.string().optional(),
  vehicleNo: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    salesOrderItemId: z.string().optional(),
    productId: z.string().min(1, 'Product is required'),
    productVariantId: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
});

export const cancelDeliveryNoteSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
});
