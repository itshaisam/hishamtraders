import { prisma, getTenantId } from '../lib/prisma.js';
import { calculateBalanceChange } from '../utils/balance-helper.js';
import logger from '../lib/logger.js';

/**
 * Auto Journal Entry Service
 *
 * Creates POSTED journal entries automatically when business transactions occur.
 * All entries are looked up by account CODE (stable) rather than CUID IDs.
 *
 * Account mapping:
 * 1101 Main Bank Account     1102 Petty Cash
 * 1200 Accounts Receivable   1300 Inventory
 * 1350 Input Tax Receivable (purchase tax — ASSET, govt owes you)
 * 2100 Accounts Payable      2200 Tax Payable (sales tax — LIABILITY, you owe govt)
 * 4100 Sales Revenue          4200 Other Income (used for returns contra)
 * 5100 COGS                   5150 Inventory Loss
 * 5200-5900 Expense accounts
 */

// Use Prisma transaction client OR regular PrismaClient
type PrismaLike = any;

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

async function resolveBankAccountCode(tx: PrismaLike, bankAccountId?: string): Promise<string> {
  if (!bankAccountId) return '1101'; // Default to Main Bank Account
  const account = await tx.accountHead.findUnique({
    where: { id: bankAccountId },
    select: { code: true },
  });
  return account?.code || '1101';
}

async function getAccountByCode(tx: PrismaLike, code: string) {
  const account = await tx.accountHead.findFirst({
    where: { code },
    select: { id: true, accountType: true },
  });
  if (!account) {
    logger.warn(`Auto-journal: Account ${code} not found, skipping journal entry`);
    return null;
  }
  return account;
}

async function generateEntryNumber(tx: PrismaLike, date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `JE-${year}${month}${day}-`;

  const latestEntry = await tx.journalEntry.findFirst({
    where: { entryNumber: { startsWith: prefix } },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });

  let nextSeq = 1;
  if (latestEntry) {
    const parts = latestEntry.entryNumber.split('-');
    nextSeq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

async function createAutoJournalEntry(
  tx: PrismaLike,
  opts: {
    date: Date;
    description: string;
    referenceType: string;
    referenceId: string;
    userId: string;
    lines: JournalLine[];
  }
): Promise<string | null> {
  // Resolve account codes to IDs
  const resolvedLines: { accountHeadId: string; accountType: string; debitAmount: number; creditAmount: number; description: string | null }[] = [];

  for (const line of opts.lines) {
    const account = await getAccountByCode(tx, line.accountCode);
    if (!account) return null; // Skip if any account missing
    resolvedLines.push({
      accountHeadId: account.id,
      accountType: account.accountType,
      debitAmount: Math.round(line.debit * 10000) / 10000,
      creditAmount: Math.round(line.credit * 10000) / 10000,
      description: line.description || null,
    });
  }

  // Validate balance
  const totalDebits = resolvedLines.reduce((s, l) => s + l.debitAmount, 0);
  const totalCredits = resolvedLines.reduce((s, l) => s + l.creditAmount, 0);
  if (Math.abs(totalDebits - totalCredits) > 0.0001) {
    logger.error('Auto-journal: Entry not balanced', { totalDebits, totalCredits, description: opts.description });
    return null;
  }

  const entryNumber = await generateEntryNumber(tx, opts.date);

  // Create POSTED entry, then lines separately (avoids nested create tenant conflict)
  const entry = await tx.journalEntry.create({
    data: {
      entryNumber,
      date: opts.date,
      description: opts.description,
      status: 'POSTED',
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      createdBy: opts.userId,
      approvedBy: opts.userId,
      tenantId: getTenantId(),
    },
  });

  await tx.journalEntryLine.createMany({
    data: resolvedLines.map((l) => ({
      journalEntryId: entry.id,
      accountHeadId: l.accountHeadId,
      debitAmount: l.debitAmount,
      creditAmount: l.creditAmount,
      description: l.description,
      tenantId: getTenantId(),
    })),
  });

  // Update account balances
  for (const line of resolvedLines) {
    const balanceChange = calculateBalanceChange(
      line.accountType as any,
      line.debitAmount,
      line.creditAmount
    );
    await tx.accountHead.update({
      where: { id: line.accountHeadId },
      data: { currentBalance: { increment: balanceChange } },
    });
  }

  logger.info(`Auto-journal created: ${entryNumber}`, {
    referenceType: opts.referenceType,
    referenceId: opts.referenceId,
    amount: totalDebits,
  });

  return entry.id;
}

// ═══════════════════════════════════════════════════════════════
// Public methods — one per transaction type
// ═══════════════════════════════════════════════════════════════

export const AutoJournalService = {
  /**
   * Invoice created: DR A/R (1200)  CR Sales Revenue (4100) + Tax Payable (2200)
   * + COGS posting: DR COGS (5100)  CR Inventory (1300)
   * Options:
   *   skipCogs: true when DN already posted COGS (full mode: SO→DN→Invoice)
   */
  async onInvoiceCreated(
    tx: PrismaLike,
    invoice: { id: string; invoiceNumber: string; total: number; subtotal: number; taxAmount: number; date: Date; items?: Array<{ productId: string; quantity: number }> },
    userId: string,
    options?: { skipCogs?: boolean }
  ) {
    // A/R journal entry: DR A/R, CR Sales + Tax
    const arLines: JournalLine[] = [
      { accountCode: '1200', debit: invoice.total, credit: 0, description: `A/R for ${invoice.invoiceNumber}` },
      { accountCode: '4100', debit: 0, credit: invoice.subtotal, description: `Sales revenue ${invoice.invoiceNumber}` },
    ];

    if (invoice.taxAmount > 0) {
      arLines.push({ accountCode: '2200', debit: 0, credit: invoice.taxAmount, description: `Tax payable ${invoice.invoiceNumber}` });
    }

    const arEntryId = await createAutoJournalEntry(tx, {
      date: invoice.date,
      description: `Invoice ${invoice.invoiceNumber}`,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      userId,
      lines: arLines,
    });

    // COGS journal entry: DR COGS (5100), CR Inventory (1300)
    // Skip if DN already posted COGS (full mode)
    if (!options?.skipCogs && invoice.items && invoice.items.length > 0) {
      let totalCogs = 0;
      for (const item of invoice.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId },
          select: { costPrice: true },
        });
        if (product?.costPrice) {
          totalCogs += Number(product.costPrice) * item.quantity;
        }
      }

      if (totalCogs > 0) {
        totalCogs = Math.round(totalCogs * 10000) / 10000;
        await createAutoJournalEntry(tx, {
          date: invoice.date,
          description: `COGS for Invoice ${invoice.invoiceNumber}`,
          referenceType: 'INVOICE',
          referenceId: invoice.id,
          userId,
          lines: [
            { accountCode: '5100', debit: totalCogs, credit: 0, description: 'Cost of Goods Sold' },
            { accountCode: '1300', debit: 0, credit: totalCogs, description: 'Inventory reduction' },
          ],
        });
      }
    }

    return arEntryId;
  },

  /**
   * Invoice voided: reverse the original entry
   * DR Sales Revenue (4100) + Tax Payable (2200)  CR A/R (1200)
   * + Reverse COGS if applicable: DR Inventory (1300)  CR COGS (5100)
   */
  async onInvoiceVoided(
    tx: PrismaLike,
    invoice: { id: string; invoiceNumber: string; total: number; subtotal: number; taxAmount: number; items?: Array<{ productId: string; quantity: number }> },
    userId: string,
    options?: { skipCogs?: boolean }
  ) {
    // Reverse A/R entry
    const lines: JournalLine[] = [
      { accountCode: '4100', debit: invoice.subtotal, credit: 0, description: `Void ${invoice.invoiceNumber}` },
      { accountCode: '1200', debit: 0, credit: invoice.total, description: `Void A/R ${invoice.invoiceNumber}` },
    ];

    if (invoice.taxAmount > 0) {
      lines.push({ accountCode: '2200', debit: invoice.taxAmount, credit: 0, description: `Void tax ${invoice.invoiceNumber}` });
    }

    await createAutoJournalEntry(tx, {
      date: new Date(),
      description: `Void Invoice ${invoice.invoiceNumber}`,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      userId,
      lines,
    });

    // Reverse COGS if it was posted at invoice time (simple mode)
    if (!options?.skipCogs && invoice.items && invoice.items.length > 0) {
      let totalCogs = 0;
      for (const item of invoice.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId },
          select: { costPrice: true },
        });
        if (product?.costPrice) {
          totalCogs += Number(product.costPrice) * item.quantity;
        }
      }

      if (totalCogs > 0) {
        totalCogs = Math.round(totalCogs * 10000) / 10000;
        await createAutoJournalEntry(tx, {
          date: new Date(),
          description: `Reverse COGS for Void Invoice ${invoice.invoiceNumber}`,
          referenceType: 'INVOICE',
          referenceId: invoice.id,
          userId,
          lines: [
            { accountCode: '1300', debit: totalCogs, credit: 0, description: 'Inventory restoration' },
            { accountCode: '5100', debit: 0, credit: totalCogs, description: 'Reverse COGS' },
          ],
        });
      }
    }
  },

  /**
   * Delivery Note dispatched (full mode): DR COGS (5100)  CR Inventory (1300)
   * COGS posting happens at dispatch — stock leaves warehouse
   */
  async onDeliveryDispatched(
    tx: PrismaLike,
    deliveryNote: { id: string; deliveryNoteNumber: string; date: Date; items: Array<{ productId: string; quantity: number }> },
    userId: string
  ) {
    let totalCogs = 0;
    for (const item of deliveryNote.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId },
        select: { costPrice: true },
      });
      if (product?.costPrice) {
        totalCogs += Number(product.costPrice) * item.quantity;
      }
    }

    if (totalCogs <= 0) return null;

    totalCogs = Math.round(totalCogs * 10000) / 10000;
    return createAutoJournalEntry(tx, {
      date: deliveryNote.date,
      description: `COGS for Delivery Note ${deliveryNote.deliveryNoteNumber}`,
      referenceType: 'DELIVERY_NOTE',
      referenceId: deliveryNote.id,
      userId,
      lines: [
        { accountCode: '5100', debit: totalCogs, credit: 0, description: 'Cost of Goods Sold' },
        { accountCode: '1300', debit: 0, credit: totalCogs, description: 'Inventory reduction' },
      ],
    });
  },

  /**
   * Client payment: DR Bank  CR A/R (1200)
   * Uses bankAccountId to resolve bank account code, defaults to 1101 Main Bank
   */
  async onClientPayment(
    paymentData: { id: string; amount: number; date: Date; referenceNumber?: string | null; bankAccountId?: string },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const bankCode = await resolveBankAccountCode(tx, paymentData.bankAccountId);
      return createAutoJournalEntry(tx, {
        date: paymentData.date,
        description: `Client payment received${paymentData.referenceNumber ? ` (${paymentData.referenceNumber})` : ''}`,
        referenceType: 'PAYMENT',
        referenceId: paymentData.id,
        userId,
        lines: [
          { accountCode: bankCode, debit: paymentData.amount, credit: 0, description: 'Bank deposit' },
          { accountCode: '1200', debit: 0, credit: paymentData.amount, description: 'A/R reduction' },
        ],
      });
    });
  },

  /**
   * Supplier payment: DR A/P (2100)  CR Bank
   * Uses bankAccountId to resolve bank account code, defaults to 1101 Main Bank
   */
  async onSupplierPayment(
    paymentData: { id: string; amount: number; date: Date; referenceNumber?: string | null; bankAccountId?: string },
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const bankCode = await resolveBankAccountCode(tx, paymentData.bankAccountId);
      return createAutoJournalEntry(tx, {
        date: paymentData.date,
        description: `Supplier payment${paymentData.referenceNumber ? ` (${paymentData.referenceNumber})` : ''}`,
        referenceType: 'PAYMENT',
        referenceId: paymentData.id,
        userId,
        lines: [
          { accountCode: '2100', debit: paymentData.amount, credit: 0, description: 'A/P reduction' },
          { accountCode: bankCode, debit: 0, credit: paymentData.amount, description: 'Bank payment' },
        ],
      });
    });
  },

  /**
   * PO receipt: DR Inventory (1300) + DR Input Tax Receivable (1350)  CR A/P (2100)
   * totalAmount = product cost + tax; taxAmount = input tax credit (govt owes you)
   */
  async onGoodsReceived(
    tx: PrismaLike,
    receipt: { poId: string; poNumber: string; totalAmount: number; taxAmount: number; date: Date },
    userId: string
  ) {
    const productCost = receipt.totalAmount - receipt.taxAmount;
    const lines: JournalLine[] = [
      { accountCode: '1300', debit: productCost, credit: 0, description: `Inventory from ${receipt.poNumber}` },
      { accountCode: '2100', debit: 0, credit: receipt.totalAmount, description: `A/P for ${receipt.poNumber}` },
    ];
    if (receipt.taxAmount > 0) {
      lines.push({ accountCode: '1350', debit: receipt.taxAmount, credit: 0, description: `Input Tax Receivable ${receipt.poNumber}` });
    }
    return createAutoJournalEntry(tx, {
      date: receipt.date,
      description: `Goods received: ${receipt.poNumber}`,
      referenceType: 'PO',
      referenceId: receipt.poId,
      userId,
      lines,
    });
  },

  /**
   * GRN cancelled: reverse goods-received entry
   * DR A/P (2100)  CR Inventory (1300) + CR Input Tax Receivable (1350)
   */
  async onGoodsReceivedReversed(
    tx: PrismaLike,
    receipt: { poId: string; poNumber: string; totalAmount: number; taxAmount: number; date: Date },
    userId: string
  ) {
    const productCost = receipt.totalAmount - receipt.taxAmount;
    const lines: JournalLine[] = [
      { accountCode: '2100', debit: receipt.totalAmount, credit: 0, description: `Reverse A/P for ${receipt.poNumber}` },
      { accountCode: '1300', debit: 0, credit: productCost, description: `Reverse inventory from ${receipt.poNumber}` },
    ];
    if (receipt.taxAmount > 0) {
      lines.push({ accountCode: '1350', debit: 0, credit: receipt.taxAmount, description: `Reverse Input Tax Receivable ${receipt.poNumber}` });
    }
    return createAutoJournalEntry(tx, {
      date: receipt.date,
      description: `Reverse goods received: ${receipt.poNumber}`,
      referenceType: 'PO',
      referenceId: receipt.poId,
      userId,
      lines,
    });
  },

  /**
   * PO additional/landed cost added: DR Inventory (1300)  CR A/P (2100)
   * Mirrors onGoodsReceived but for additional costs (shipping, customs, tax, other)
   */
  async onPOCostAdded(
    tx: PrismaLike,
    cost: { poId: string; poNumber: string; amount: number; type: string; date: Date },
    userId: string
  ) {
    return createAutoJournalEntry(tx, {
      date: cost.date,
      description: `PO additional cost (${cost.type}): ${cost.poNumber}`,
      referenceType: 'PO',
      referenceId: cost.poId,
      userId,
      lines: [
        { accountCode: '1300', debit: cost.amount, credit: 0, description: `Landed cost (${cost.type}) for ${cost.poNumber}` },
        { accountCode: '2100', debit: 0, credit: cost.amount, description: `A/P for ${cost.type} — ${cost.poNumber}` },
      ],
    });
  },

  /**
   * GRN additional/landed cost added: DR Inventory (1300)  CR A/P (2100)
   */
  async onGRNCostAdded(
    tx: PrismaLike,
    cost: { grnId: string; grnNumber: string; poNumber: string; amount: number; type: string; date: Date },
    userId: string
  ) {
    return createAutoJournalEntry(tx, {
      date: cost.date,
      description: `GRN additional cost (${cost.type}): ${cost.grnNumber} (${cost.poNumber})`,
      referenceType: 'PO',
      referenceId: cost.grnId,
      userId,
      lines: [
        { accountCode: '1300', debit: cost.amount, credit: 0, description: `Landed cost (${cost.type}) for ${cost.grnNumber}` },
        { accountCode: '2100', debit: 0, credit: cost.amount, description: `A/P for ${cost.type} — ${cost.grnNumber}` },
      ],
    });
  },

  /**
   * GRN cost reversal (on GRN cancellation): DR A/P (2100)  CR Inventory (1300)
   */
  async onGRNCostReversed(
    tx: PrismaLike,
    cost: { grnId: string; grnNumber: string; amount: number; type: string; date: Date },
    userId: string
  ) {
    return createAutoJournalEntry(tx, {
      date: cost.date,
      description: `Reverse GRN cost (${cost.type}): ${cost.grnNumber}`,
      referenceType: 'PO',
      referenceId: cost.grnId,
      userId,
      lines: [
        { accountCode: '2100', debit: cost.amount, credit: 0, description: `Reverse A/P for ${cost.type} — ${cost.grnNumber}` },
        { accountCode: '1300', debit: 0, credit: cost.amount, description: `Reverse landed cost (${cost.type}) for ${cost.grnNumber}` },
      ],
    });
  },

  /**
   * Expense: DR Expense account (5xxx)  CR Cash/Bank
   * Cash → 1102 Petty Cash, Bank → 1101 Main Bank
   */
  async onExpenseCreated(
    expenseData: {
      id: string;
      amount: number;
      category: string;
      description: string;
      date: Date;
      paymentMethod: string;
    },
    userId: string
  ) {
    const expenseCode = EXPENSE_ACCOUNT_MAP[expenseData.category] || '5900';
    const creditCode = expenseData.paymentMethod === 'CASH' ? '1102' : '1101';

    return prisma.$transaction(async (tx) => {
      return createAutoJournalEntry(tx, {
        date: expenseData.date,
        description: `Expense: ${expenseData.description}`,
        referenceType: 'EXPENSE',
        referenceId: expenseData.id,
        userId,
        lines: [
          { accountCode: expenseCode, debit: expenseData.amount, credit: 0, description: expenseData.category },
          { accountCode: creditCode, debit: 0, credit: expenseData.amount, description: expenseData.paymentMethod === 'CASH' ? 'Petty cash' : 'Bank payment' },
        ],
      });
    });
  },

  /**
   * Expense deleted: reverse the entry
   */
  async onExpenseDeleted(
    expenseData: {
      id: string;
      amount: number;
      category: string;
      description: string;
      date: Date;
      paymentMethod: string;
    },
    userId: string
  ) {
    const expenseCode = EXPENSE_ACCOUNT_MAP[expenseData.category] || '5900';
    const creditCode = expenseData.paymentMethod === 'CASH' ? '1102' : '1101';

    return prisma.$transaction(async (tx) => {
      return createAutoJournalEntry(tx, {
        date: new Date(),
        description: `Reverse expense: ${expenseData.description}`,
        referenceType: 'EXPENSE',
        referenceId: expenseData.id,
        userId,
        lines: [
          { accountCode: creditCode, debit: expenseData.amount, credit: 0, description: 'Reversal' },
          { accountCode: expenseCode, debit: 0, credit: expenseData.amount, description: 'Expense reversal' },
        ],
      });
    });
  },

  /**
   * Stock adjustment approved (DECREASE only): DR Inventory Loss (5150)  CR Inventory (1300)
   * INCREASE adjustments don't create JEs (typically corrections, not purchases)
   */
  async onStockAdjustmentApproved(
    tx: PrismaLike,
    adjustment: {
      id: string;
      adjustmentType: string;
      quantity: number;
      costPrice: number;
      reason: string;
    },
    userId: string
  ) {
    // Only create JE for loss types (WASTAGE, DAMAGE, THEFT)
    const lossTypes = ['WASTAGE', 'DAMAGE', 'THEFT'];
    if (!lossTypes.includes(adjustment.adjustmentType)) return null;

    const amount = Math.round(adjustment.quantity * adjustment.costPrice * 10000) / 10000;
    if (amount <= 0) return null;

    return createAutoJournalEntry(tx, {
      date: new Date(),
      description: `Stock adjustment: ${adjustment.reason}`,
      referenceType: 'ADJUSTMENT',
      referenceId: adjustment.id,
      userId,
      lines: [
        { accountCode: '5150', debit: amount, credit: 0, description: 'Inventory loss' },
        { accountCode: '1300', debit: 0, credit: amount, description: 'Inventory reduction' },
      ],
    });
  },

  /**
   * Credit note: DR Other Income/Returns (4200)  CR A/R (1200)
   */
  async onCreditNoteCreated(
    tx: PrismaLike,
    creditNote: { id: string; creditNoteNumber: string; totalAmount: number; date: Date },
    userId: string
  ) {
    return createAutoJournalEntry(tx, {
      date: creditNote.date,
      description: `Credit note ${creditNote.creditNoteNumber}`,
      referenceType: 'CREDIT_NOTE',
      referenceId: creditNote.id,
      userId,
      lines: [
        { accountCode: '4200', debit: creditNote.totalAmount, credit: 0, description: `Returns ${creditNote.creditNoteNumber}` },
        { accountCode: '1200', debit: 0, credit: creditNote.totalAmount, description: `A/R reduction ${creditNote.creditNoteNumber}` },
      ],
    });
  },

  /**
   * Credit note voided: reverse the entry
   */
  async onCreditNoteVoided(
    tx: PrismaLike,
    creditNote: { id: string; creditNoteNumber: string; totalAmount: number },
    userId: string
  ) {
    return createAutoJournalEntry(tx, {
      date: new Date(),
      description: `Void credit note ${creditNote.creditNoteNumber}`,
      referenceType: 'CREDIT_NOTE',
      referenceId: creditNote.id,
      userId,
      lines: [
        { accountCode: '1200', debit: creditNote.totalAmount, credit: 0, description: `Restore A/R ${creditNote.creditNoteNumber}` },
        { accountCode: '4200', debit: 0, credit: creditNote.totalAmount, description: `Reverse returns ${creditNote.creditNoteNumber}` },
      ],
    });
  },
};
