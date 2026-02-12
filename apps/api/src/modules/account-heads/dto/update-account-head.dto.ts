import { z } from 'zod';
import { AccountStatus } from '@prisma/client';

export const updateAccountHeadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .optional(),
  parentId: z.string().optional().nullable(),
  openingBalance: z.number().optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  description: z.string().max(500).optional().nullable(),
});

export type UpdateAccountHeadDto = z.infer<typeof updateAccountHeadSchema>;
