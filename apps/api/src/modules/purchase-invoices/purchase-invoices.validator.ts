import { z } from 'zod';

export const createPurchaseInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Supplier invoice number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  poId: z.string().nullish(),
  grnId: z.string().nullish(),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().nullish(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().nullish(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    productVariantId: z.string().optional().nullable(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitCost: z.number().positive('Unit cost must be positive'),
  })).min(1, 'At least one item is required'),
});

export const cancelPurchaseInvoiceSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
});
