import { z } from 'zod';
import { AccountType, AccountStatus } from '@prisma/client';

export const accountHeadFilterSchema = z.object({
  accountType: z.nativeEnum(AccountType).optional(),
  status: z.nativeEnum(AccountStatus).optional(),
  parentId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
});

export type AccountHeadFilters = z.infer<typeof accountHeadFilterSchema>;
