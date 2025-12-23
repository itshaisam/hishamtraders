import { z } from 'zod';

/**
 * Enum for adjustment types
 */
export const AdjustmentTypeEnum = z.enum(['WASTAGE', 'DAMAGE', 'THEFT', 'CORRECTION']);

/**
 * Enum for adjustment status
 */
export const AdjustmentStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

/**
 * Schema for creating a stock adjustment
 */
export const createAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productVariantId: z.string().optional().nullable(),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  adjustmentType: AdjustmentTypeEnum,
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .refine((val) => val !== 0, {
      message: 'Quantity cannot be zero',
    }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notes: z.string().optional().nullable(),
});

export type CreateAdjustmentDto = z.infer<typeof createAdjustmentSchema>;

/**
 * Schema for rejecting an adjustment
 */
export const rejectAdjustmentSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export type RejectAdjustmentDto = z.infer<typeof rejectAdjustmentSchema>;

/**
 * Schema for query filters
 */
export const adjustmentFiltersSchema = z.object({
  productId: z.string().optional(),
  warehouseId: z.string().optional(),
  status: AdjustmentStatusEnum.optional(),
  createdBy: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
});

export type AdjustmentFiltersDto = z.infer<typeof adjustmentFiltersSchema>;
