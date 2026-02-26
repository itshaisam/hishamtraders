import { z } from 'zod';

// Invoice line item schema
export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productVariantId: z.string().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discount: z.number().min(0).max(100, 'Discount must be between 0 and 100').default(0), // Percentage
  salesOrderItemId: z.string().optional(), // Link to SO item for quantity tracking
});

// Create invoice schema
export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  invoiceDate: z.string().or(z.date()).transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  paymentType: z.enum(['CASH', 'CREDIT'], {
    required_error: 'Payment type is required',
  }),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  adminOverride: z.boolean().optional().default(false), // For credit limit override
  overrideReason: z.string().optional(), // Mandatory if adminOverride is true
  salesOrderId: z.string().optional(), // Link to Sales Order
  deliveryNoteId: z.string().optional(), // Link to Delivery Note
  taxRate: z.number().min(0).max(100).optional(), // Override sales tax rate (defaults to system setting)
});

// Type inference
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type InvoiceItemDto = z.infer<typeof invoiceItemSchema>;

// Custom validation: overrideReason required if adminOverride is true
export const validateCreateInvoice = (data: CreateInvoiceDto) => {
  if (data.adminOverride && !data.overrideReason) {
    throw new Error('Override reason is required when overriding credit limit');
  }
  return data;
};
