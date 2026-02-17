/**
 * GL Migration Script — Story 5.0
 *
 * Creates historical journal entries for all existing MVP transactions.
 * Idempotent: checks referenceType + referenceId before creating.
 *
 * Run: npx tsx apps/api/src/scripts/migrate-to-gl.ts
 *
 * Processing order:
 *   1. PO Receipts (Inventory ↑, A/P ↑)
 *   2. Invoices (A/R ↑, Revenue ↑)
 *   3. Client Payments (Bank ↑, A/R ↓)
 *   4. Supplier Payments (A/P ↓, Bank ↓)
 *   5. Expenses (Expense ↑, Bank/Cash ↓)
 *   6. Stock Adjustments (Inv Loss ↑, Inventory ↓)
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Account code → ID cache
const accountCache = new Map<string, { id: string; accountType: string }>();

const EXPENSE_ACCOUNT_MAP: Record<string, string> = {
  RENT: '5200',
  UTILITIES: '5300',
  SALARIES: '5400',
  TRANSPORT: '5500',
  SUPPLIES: '5900',
  MAINTENANCE: '5900',
  MARKETING: '5900',
  MISC: '5900',
};

// Counters
const counts = {
  poReceipts: { processed: 0, skipped: 0 },
  invoices: { processed: 0, skipped: 0 },
  clientPayments: { processed: 0, skipped: 0 },
  supplierPayments: { processed: 0, skipped: 0 },
  expenses: { processed: 0, skipped: 0 },
  stockAdjustments: { processed: 0, skipped: 0 },
};

async function getAccount(code: string) {
  if (accountCache.has(code)) return accountCache.get(code)!;
  const account = await prisma.accountHead.findFirst({
    where: { code },
    select: { id: true, accountType: true },
  });
  if (!account) throw new Error(`Account ${code} not found. Run seed first.`);
  accountCache.set(code, account);
  return account;
}

function calculateBalanceChange(accountType: string, debit: number, credit: number): number {
  const isDebitNormal = accountType === 'ASSET' || accountType === 'EXPENSE';
  return isDebitNormal ? debit - credit : credit - debit;
}

async function generateEntryNumber(tx: Prisma.TransactionClient, date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `JE-${year}${month}${day}-`;

  const latest = await tx.journalEntry.findFirst({
    where: { entryNumber: { startsWith: prefix } },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });

  let nextSeq = 1;
  if (latest) {
    const parts = latest.entryNumber.split('-');
    nextSeq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

async function entryExists(referenceType: string, referenceId: string): Promise<boolean> {
  const existing = await prisma.journalEntry.findFirst({
    where: { referenceType, referenceId },
    select: { id: true },
  });
  return !!existing;
}

interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
}

async function createJournalEntry(
  tx: Prisma.TransactionClient,
  opts: {
    date: Date;
    description: string;
    referenceType: string;
    referenceId: string;
    userId: string;
    lines: JournalLine[];
  }
) {
  const resolvedLines: {
    accountHeadId: string;
    accountType: string;
    debitAmount: number;
    creditAmount: number;
    description: string | null;
  }[] = [];

  for (const line of opts.lines) {
    const account = await getAccount(line.accountCode);
    resolvedLines.push({
      accountHeadId: account.id,
      accountType: account.accountType,
      debitAmount: Math.round(line.debit * 100) / 100,
      creditAmount: Math.round(line.credit * 100) / 100,
      description: line.description,
    });
  }

  // Validate
  const totalD = resolvedLines.reduce((s, l) => s + l.debitAmount, 0);
  const totalC = resolvedLines.reduce((s, l) => s + l.creditAmount, 0);
  if (Math.abs(totalD - totalC) > 0.01) {
    console.error(`  UNBALANCED: debits=${totalD.toFixed(2)} credits=${totalC.toFixed(2)} — ${opts.description}`);
    return;
  }

  const entryNumber = await generateEntryNumber(tx, opts.date);

  await (tx.journalEntry as any).create({
    data: {
      entryNumber,
      date: opts.date,
      description: opts.description,
      status: 'POSTED',
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      createdBy: opts.userId,
      approvedBy: opts.userId,
      lines: {
        create: resolvedLines.map((l) => ({
          accountHeadId: l.accountHeadId,
          debitAmount: l.debitAmount,
          creditAmount: l.creditAmount,
          description: l.description,
        })),
      },
    },
  });

  // Update account balances
  for (const line of resolvedLines) {
    const change = calculateBalanceChange(line.accountType, line.debitAmount, line.creditAmount);
    await tx.accountHead.update({
      where: { id: line.accountHeadId },
      data: { currentBalance: { increment: change } },
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. PO Receipts — DR Inventory (1300), CR A/P (2100)
// ═══════════════════════════════════════════════════════════════
async function migratePOReceipts(adminId: string) {
  console.log('\n[1/6] Migrating PO Receipts...');

  const receivedPOs = await prisma.purchaseOrder.findMany({
    where: { status: 'RECEIVED' },
    select: { id: true, poNumber: true, totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  for (const po of receivedPOs) {
    if (await entryExists('PO', po.id)) {
      counts.poReceipts.skipped++;
      continue;
    }

    const amount = parseFloat(po.totalAmount.toString());
    if (amount <= 0) {
      counts.poReceipts.skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await createJournalEntry(tx, {
        date: po.createdAt,
        description: `Goods received: ${po.poNumber}`,
        referenceType: 'PO',
        referenceId: po.id,
        userId: adminId,
        lines: [
          { accountCode: '1300', debit: amount, credit: 0, description: `Inventory from ${po.poNumber}` },
          { accountCode: '2100', debit: 0, credit: amount, description: `A/P for ${po.poNumber}` },
        ],
      });
    });
    counts.poReceipts.processed++;
  }

  console.log(`  PO Receipts: ${counts.poReceipts.processed} created, ${counts.poReceipts.skipped} skipped`);
}

// ═══════════════════════════════════════════════════════════════
// 2. Invoices — DR A/R (1200), CR Sales Revenue (4100) + Tax Payable (2200)
// ═══════════════════════════════════════════════════════════════
async function migrateInvoices(adminId: string) {
  console.log('\n[2/6] Migrating Invoices...');

  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ['VOIDED', 'CANCELLED'] } },
    select: { id: true, invoiceNumber: true, invoiceDate: true, total: true, subtotal: true, taxAmount: true },
    orderBy: { invoiceDate: 'asc' },
  });

  for (const inv of invoices) {
    if (await entryExists('INVOICE', inv.id)) {
      counts.invoices.skipped++;
      continue;
    }

    const total = parseFloat(inv.total.toString());
    const subtotal = parseFloat(inv.subtotal.toString());
    const taxAmount = parseFloat(inv.taxAmount.toString());

    if (total <= 0) {
      counts.invoices.skipped++;
      continue;
    }

    const lines: JournalLine[] = [
      { accountCode: '1200', debit: total, credit: 0, description: `A/R for ${inv.invoiceNumber}` },
      { accountCode: '4100', debit: 0, credit: subtotal, description: `Sales revenue ${inv.invoiceNumber}` },
    ];

    if (taxAmount > 0) {
      lines.push({ accountCode: '2200', debit: 0, credit: taxAmount, description: `Tax payable ${inv.invoiceNumber}` });
    }

    await prisma.$transaction(async (tx) => {
      await createJournalEntry(tx, {
        date: inv.invoiceDate,
        description: `Invoice ${inv.invoiceNumber}`,
        referenceType: 'INVOICE',
        referenceId: inv.id,
        userId: adminId,
        lines,
      });
    });
    counts.invoices.processed++;
  }

  console.log(`  Invoices: ${counts.invoices.processed} created, ${counts.invoices.skipped} skipped`);
}

// ═══════════════════════════════════════════════════════════════
// 3. Client Payments — DR Bank (1101), CR A/R (1200)
// ═══════════════════════════════════════════════════════════════
async function migrateClientPayments(adminId: string) {
  console.log('\n[3/6] Migrating Client Payments...');

  const payments = await prisma.payment.findMany({
    where: { paymentType: 'CLIENT' },
    select: {
      id: true, amount: true, date: true, referenceNumber: true, bankAccountId: true,
      bankAccount: { select: { code: true } },
    },
    orderBy: { date: 'asc' },
  });

  for (const pay of payments) {
    if (await entryExists('PAYMENT', pay.id)) {
      counts.clientPayments.skipped++;
      continue;
    }

    const amount = parseFloat(pay.amount.toString());
    if (amount <= 0) {
      counts.clientPayments.skipped++;
      continue;
    }

    const bankCode = pay.bankAccount?.code || '1101';

    await prisma.$transaction(async (tx) => {
      await createJournalEntry(tx, {
        date: pay.date,
        description: `Client payment received${pay.referenceNumber ? ` (${pay.referenceNumber})` : ''}`,
        referenceType: 'PAYMENT',
        referenceId: pay.id,
        userId: adminId,
        lines: [
          { accountCode: bankCode, debit: amount, credit: 0, description: 'Bank deposit' },
          { accountCode: '1200', debit: 0, credit: amount, description: 'A/R reduction' },
        ],
      });
    });
    counts.clientPayments.processed++;
  }

  console.log(`  Client Payments: ${counts.clientPayments.processed} created, ${counts.clientPayments.skipped} skipped`);
}

// ═══════════════════════════════════════════════════════════════
// 4. Supplier Payments — DR A/P (2100), CR Bank (1101)
// ═══════════════════════════════════════════════════════════════
async function migrateSupplierPayments(adminId: string) {
  console.log('\n[4/6] Migrating Supplier Payments...');

  const payments = await prisma.payment.findMany({
    where: { paymentType: 'SUPPLIER' },
    select: {
      id: true, amount: true, date: true, referenceNumber: true, bankAccountId: true,
      bankAccount: { select: { code: true } },
    },
    orderBy: { date: 'asc' },
  });

  for (const pay of payments) {
    if (await entryExists('PAYMENT', pay.id)) {
      counts.supplierPayments.skipped++;
      continue;
    }

    const amount = parseFloat(pay.amount.toString());
    if (amount <= 0) {
      counts.supplierPayments.skipped++;
      continue;
    }

    const bankCode = pay.bankAccount?.code || '1101';

    await prisma.$transaction(async (tx) => {
      await createJournalEntry(tx, {
        date: pay.date,
        description: `Supplier payment${pay.referenceNumber ? ` (${pay.referenceNumber})` : ''}`,
        referenceType: 'PAYMENT',
        referenceId: pay.id,
        userId: adminId,
        lines: [
          { accountCode: '2100', debit: amount, credit: 0, description: 'A/P reduction' },
          { accountCode: bankCode, debit: 0, credit: amount, description: 'Bank payment' },
        ],
      });
    });
    counts.supplierPayments.processed++;
  }

  console.log(`  Supplier Payments: ${counts.supplierPayments.processed} created, ${counts.supplierPayments.skipped} skipped`);
}

// ═══════════════════════════════════════════════════════════════
// 5. Expenses — DR Expense (5xxx), CR Cash/Bank
// ═══════════════════════════════════════════════════════════════
async function migrateExpenses(adminId: string) {
  console.log('\n[5/6] Migrating Expenses...');

  const expenses = await prisma.expense.findMany({
    select: { id: true, amount: true, category: true, description: true, date: true, paymentMethod: true },
    orderBy: { date: 'asc' },
  });

  for (const exp of expenses) {
    if (await entryExists('EXPENSE', exp.id)) {
      counts.expenses.skipped++;
      continue;
    }

    const amount = parseFloat(exp.amount.toString());
    if (amount <= 0) {
      counts.expenses.skipped++;
      continue;
    }

    const expenseCode = EXPENSE_ACCOUNT_MAP[exp.category] || '5900';
    const creditCode = exp.paymentMethod === 'CASH' ? '1102' : '1101';

    await prisma.$transaction(async (tx) => {
      await createJournalEntry(tx, {
        date: exp.date,
        description: `Expense: ${exp.description}`,
        referenceType: 'EXPENSE',
        referenceId: exp.id,
        userId: adminId,
        lines: [
          { accountCode: expenseCode, debit: amount, credit: 0, description: exp.category },
          { accountCode: creditCode, debit: 0, credit: amount, description: exp.paymentMethod === 'CASH' ? 'Petty cash' : 'Bank payment' },
        ],
      });
    });
    counts.expenses.processed++;
  }

  console.log(`  Expenses: ${counts.expenses.processed} created, ${counts.expenses.skipped} skipped`);
}

// ═══════════════════════════════════════════════════════════════
// 6. Stock Adjustments — DR Inventory Loss (5150), CR Inventory (1300)
//    Only for WASTAGE, DAMAGE, THEFT (loss types) that are APPROVED
// ═══════════════════════════════════════════════════════════════
async function migrateStockAdjustments(adminId: string) {
  console.log('\n[6/6] Migrating Stock Adjustments...');

  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      status: 'APPROVED',
      adjustmentType: { in: ['WASTAGE', 'DAMAGE', 'THEFT'] },
    },
    select: {
      id: true, adjustmentType: true, quantity: true, reason: true, createdAt: true,
      productId: true, productVariantId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const adj of adjustments) {
    if (await entryExists('ADJUSTMENT', adj.id)) {
      counts.stockAdjustments.skipped++;
      continue;
    }

    // Get cost price from variant or product
    let costPrice = 0;
    if (adj.productVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: adj.productVariantId },
        select: { costPrice: true },
      });
      costPrice = parseFloat((variant?.costPrice || 0).toString());
    }
    if (costPrice === 0) {
      const product = await prisma.product.findUnique({
        where: { id: adj.productId },
        select: { costPrice: true },
      });
      costPrice = parseFloat((product?.costPrice || 0).toString());
    }

    const amount = Math.round(Math.abs(adj.quantity) * costPrice * 100) / 100;
    if (amount <= 0) {
      counts.stockAdjustments.skipped++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await createJournalEntry(tx, {
        date: adj.createdAt,
        description: `Stock adjustment: ${adj.reason}`,
        referenceType: 'ADJUSTMENT',
        referenceId: adj.id,
        userId: adminId,
        lines: [
          { accountCode: '5150', debit: amount, credit: 0, description: 'Inventory loss' },
          { accountCode: '1300', debit: 0, credit: amount, description: 'Inventory reduction' },
        ],
      });
    });
    counts.stockAdjustments.processed++;
  }

  console.log(`  Stock Adjustments: ${counts.stockAdjustments.processed} created, ${counts.stockAdjustments.skipped} skipped`);
}

// ═══════════════════════════════════════════════════════════════
// Validation: Trial Balance check
// ═══════════════════════════════════════════════════════════════
async function validateTrialBalance() {
  console.log('\n--- Post-Migration Validation ---');

  const lines = await prisma.journalEntryLine.findMany({
    where: { journalEntry: { status: 'POSTED' } },
    select: { debitAmount: true, creditAmount: true },
  });

  const totalDebits = lines.reduce((s, l) => s + parseFloat(l.debitAmount.toString()), 0);
  const totalCredits = lines.reduce((s, l) => s + parseFloat(l.creditAmount.toString()), 0);
  const diff = Math.abs(totalDebits - totalCredits);

  console.log(`  Total Debits:  ${totalDebits.toFixed(2)}`);
  console.log(`  Total Credits: ${totalCredits.toFixed(2)}`);
  console.log(`  Difference:    ${diff.toFixed(2)}`);
  console.log(`  Balanced:      ${diff < 0.01 ? 'YES ✓' : 'NO ✗'}`);

  if (diff >= 0.01) {
    console.error('\n  ⚠ WARNING: Trial balance is NOT balanced after migration!');
  }
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  GL Migration Script — Hisham Traders ERP');
  console.log('═══════════════════════════════════════════════════');

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: { name: 'ADMIN' } },
    select: { id: true, name: true },
  });

  if (!admin) {
    console.error('Admin user not found. Please seed the database first.');
    process.exit(1);
  }

  console.log(`\nUsing admin user: ${admin.name} (${admin.id})`);

  // Run migrations in order
  await migratePOReceipts(admin.id);
  await migrateInvoices(admin.id);
  await migrateClientPayments(admin.id);
  await migrateSupplierPayments(admin.id);
  await migrateExpenses(admin.id);
  await migrateStockAdjustments(admin.id);

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  PO Receipts:       ${counts.poReceipts.processed} created, ${counts.poReceipts.skipped} skipped`);
  console.log(`  Invoices:          ${counts.invoices.processed} created, ${counts.invoices.skipped} skipped`);
  console.log(`  Client Payments:   ${counts.clientPayments.processed} created, ${counts.clientPayments.skipped} skipped`);
  console.log(`  Supplier Payments: ${counts.supplierPayments.processed} created, ${counts.supplierPayments.skipped} skipped`);
  console.log(`  Expenses:          ${counts.expenses.processed} created, ${counts.expenses.skipped} skipped`);
  console.log(`  Stock Adjustments: ${counts.stockAdjustments.processed} created, ${counts.stockAdjustments.skipped} skipped`);

  const totalProcessed = Object.values(counts).reduce((s, c) => s + c.processed, 0);
  const totalSkipped = Object.values(counts).reduce((s, c) => s + c.skipped, 0);
  console.log(`\n  Total: ${totalProcessed} journal entries created, ${totalSkipped} skipped`);

  // Validate
  await validateTrialBalance();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Migration Complete');
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
