import { z } from 'zod';
import { POStatus } from '@prisma/client';

export const updatePurchaseOrderSchema = z.object({
  expectedArrivalDate: z.string().datetime('Invalid date format')
    .or(z.date())
    .pipe(z.coerce.date())
    .optional(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'] as const).optional(),
  notes: z.string().optional(),
});

export type UpdatePurchaseOrderRequest = z.infer<typeof updatePurchaseOrderSchema>;

export interface UpdatePOStatusRequest {
  status: POStatus;
}
