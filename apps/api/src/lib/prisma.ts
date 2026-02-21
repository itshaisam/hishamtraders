import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

// Per-request tenant context using AsyncLocalStorage
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

// Models that require tenantId filtering
const TENANT_SCOPED_MODELS = new Set([
  'Supplier', 'Warehouse', 'BinLocation',
  'Product', 'ProductVariant',
  'PurchaseOrder', 'POItem', 'POCost',
  'GoodsReceiveNote', 'GoodsReceiveNoteItem', 'GRNCost',
  'Inventory', 'StockMovement', 'StockAdjustment',
  'StockTransfer', 'StockTransferItem',
  'StockCount', 'StockCountItem',
  'Client', 'Invoice', 'InvoiceItem',
  'CreditNote', 'CreditNoteItem',
  'Payment', 'PaymentAllocation',
  'Expense',
  'GatePass', 'GatePassItem',
  'AccountHead', 'JournalEntry', 'JournalEntryLine',
  'BankReconciliation', 'BankReconciliationItem', 'PeriodClose',
  'RecoveryVisit', 'PaymentPromise',
  'Alert', 'AlertRule',
  'SystemSetting', 'ChangeHistory',
  'AuditLog', 'User',
]);

const READ_OPS = new Set([
  'findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow',
  'count', 'aggregate', 'groupBy',
]);
const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn']);
const MUTATE_OPS = new Set(['update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const prisma = basePrisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      // Skip non-tenant-scoped models
      if (!model || !TENANT_SCOPED_MODELS.has(model)) {
        return query(args);
      }

      const store = tenantContext.getStore();
      // No tenant context = system operation (seed, migration) — skip filtering
      if (!store?.tenantId) {
        return query(args);
      }

      const tenantId = store.tenantId;

      // READ operations: inject tenantId into where clause
      if (READ_OPS.has(operation)) {
        args.where = { ...args.where, tenantId };
      }

      // CREATE operations: inject tenantId into data (only if not already set)
      if (CREATE_OPS.has(operation)) {
        if (operation === 'createMany' || operation === 'createManyAndReturn') {
          if (Array.isArray((args as any).data)) {
            (args as any).data = (args as any).data.map((d: any) =>
              d.tenantId ? d : { ...d, tenantId }
            );
          }
        } else {
          const data = (args as any).data;
          if (!data?.tenantId && !data?.tenant) {
            (args as any).data = { ...data, tenantId };
          }
        }
      }

      // UPDATE/DELETE operations: inject tenantId into where clause
      if (MUTATE_OPS.has(operation)) {
        if (operation === 'upsert') {
          args.where = { ...args.where, tenantId };
          const createData = (args as any).create;
          if (!createData?.tenantId && !createData?.tenant) {
            (args as any).create = { ...createData, tenantId };
          }
        } else {
          args.where = { ...args.where, tenantId };
        }
      }

      return query(args);
    },
  },
});

export type ExtendedPrismaClient = typeof prisma;

// Type for prisma transaction client — use in functions that accept a transaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Get the current tenant ID from AsyncLocalStorage context.
 * Returns the tenantId or throws if no tenant context is set.
 * Use this in create/upsert operations to satisfy TypeScript's type checking.
 * The Prisma Extension also injects tenantId as a safety net.
 */
export function getTenantId(): string {
  const store = tenantContext.getStore();
  if (!store?.tenantId) {
    throw new Error('No tenant context available. Ensure request is wrapped in tenantMiddleware.');
  }
  return store.tenantId;
}
