import { z } from 'zod';
import { AccountType, AccountStatus } from '@prisma/client';

export const createAccountHeadSchema = z.object({
  code: z
    .string()
    .min(4, 'Code must be at least 4 characters')
    .max(10, 'Code must not exceed 10 characters')
    .regex(/^\d+$/, 'Code must contain only digits'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  accountType: z.nativeEnum(AccountType, {
    errorMap: () => ({ message: 'Invalid account type' }),
  }),
  parentId: z.string().optional().nullable(),
  openingBalance: z.number().default(0),
  status: z.nativeEnum(AccountStatus).default('ACTIVE'),
  isSystemAccount: z.boolean().default(false),
  description: z.string().max(500).optional().nullable(),
});

export type CreateAccountHeadDto = z.infer<typeof createAccountHeadSchema>;
