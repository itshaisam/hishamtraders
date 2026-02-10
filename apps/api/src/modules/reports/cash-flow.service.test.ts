import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashFlowService } from './cash-flow.service.js';

// Create mock Prisma client
const mockPrisma = {
  payment: {
    findMany: vi.fn(),
  },
  expense: {
    findMany: vi.fn(),
  },
};

describe('CashFlowService', () => {
  let service: CashFlowService;
  const dateFrom = new Date('2025-01-01');
  const dateTo = new Date('2025-01-31');

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CashFlowService(mockPrisma as any);
  });

  it('should calculate correct totals with mixed payment types and expenses', async () => {
    // Client payments (IN)
    mockPrisma.payment.findMany
      .mockResolvedValueOnce([
        { amount: '10000.00', method: 'CASH' },
        { amount: '25000.00', method: 'BANK_TRANSFER' },
        { amount: '5000.00', method: 'CHEQUE' },
      ])
      // Supplier payments (OUT)
      .mockResolvedValueOnce([
        { amount: '8000.00', method: 'CASH' },
        { amount: '12000.00', method: 'BANK_TRANSFER' },
      ]);

    // Expenses (OUT)
    mockPrisma.expense.findMany.mockResolvedValue([
      { amount: '3000.00', paymentMethod: 'CASH' },
      { amount: '2000.00', paymentMethod: 'BANK_TRANSFER' },
    ]);

    const result = await service.getCashFlowReport(dateFrom, dateTo);

    // Total IN = 10000 + 25000 + 5000 = 40000
    expect(result.totalCashIn).toBe(40000);
    // Total supplier OUT = 8000 + 12000 = 20000
    expect(result.totalSupplierPayments).toBe(20000);
    // Total expenses = 3000 + 2000 = 5000
    expect(result.totalExpenses).toBe(5000);
    // Total OUT = 20000 + 5000 = 25000
    expect(result.totalCashOut).toBe(25000);
    // Net = 40000 - 25000 = 15000
    expect(result.netCashFlow).toBe(15000);
  });

  it('should group amounts by payment method correctly', async () => {
    mockPrisma.payment.findMany
      .mockResolvedValueOnce([
        { amount: '10000.00', method: 'CASH' },
        { amount: '5000.00', method: 'CASH' },
        { amount: '20000.00', method: 'BANK_TRANSFER' },
      ])
      .mockResolvedValueOnce([
        { amount: '7000.00', method: 'CASH' },
        { amount: '3000.00', method: 'CHEQUE' },
      ]);

    mockPrisma.expense.findMany.mockResolvedValue([
      { amount: '1000.00', paymentMethod: 'CASH' },
    ]);

    const result = await service.getCashFlowReport(dateFrom, dateTo);

    const cashMethod = result.byPaymentMethod.find((m) => m.method === 'CASH');
    expect(cashMethod).toEqual({
      method: 'CASH',
      cashIn: 15000,   // 10000 + 5000
      cashOut: 8000,    // 7000 supplier + 1000 expense
      net: 7000,        // 15000 - 8000
    });

    const bankMethod = result.byPaymentMethod.find((m) => m.method === 'BANK_TRANSFER');
    expect(bankMethod).toEqual({
      method: 'BANK_TRANSFER',
      cashIn: 20000,
      cashOut: 0,
      net: 20000,
    });

    const chequeMethod = result.byPaymentMethod.find((m) => m.method === 'CHEQUE');
    expect(chequeMethod).toEqual({
      method: 'CHEQUE',
      cashIn: 0,
      cashOut: 3000,
      net: -3000,
    });
  });

  it('should return zeros when no payments or expenses exist', async () => {
    mockPrisma.payment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);

    const result = await service.getCashFlowReport(dateFrom, dateTo);

    expect(result.totalCashIn).toBe(0);
    expect(result.totalCashOut).toBe(0);
    expect(result.totalSupplierPayments).toBe(0);
    expect(result.totalExpenses).toBe(0);
    expect(result.netCashFlow).toBe(0);
    expect(result.byPaymentMethod).toHaveLength(3);
    result.byPaymentMethod.forEach((m) => {
      expect(m.cashIn).toBe(0);
      expect(m.cashOut).toBe(0);
      expect(m.net).toBe(0);
    });
  });

  it('should handle negative net cash flow (more out than in)', async () => {
    mockPrisma.payment.findMany
      .mockResolvedValueOnce([
        { amount: '5000.00', method: 'CASH' },
      ])
      .mockResolvedValueOnce([
        { amount: '15000.00', method: 'CASH' },
      ]);
    mockPrisma.expense.findMany.mockResolvedValue([
      { amount: '5000.00', paymentMethod: 'CASH' },
    ]);

    const result = await service.getCashFlowReport(dateFrom, dateTo);

    expect(result.totalCashIn).toBe(5000);
    expect(result.totalCashOut).toBe(20000);
    expect(result.netCashFlow).toBe(-15000);
  });

  it('should pass correct date filters to Prisma queries', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);

    await service.getCashFlowReport(dateFrom, dateTo);

    const dateFilter = { gte: dateFrom, lte: dateTo };

    // Client payments query
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
      where: { paymentType: 'CLIENT', date: dateFilter },
      select: { amount: true, method: true },
    });

    // Supplier payments query
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
      where: { paymentType: 'SUPPLIER', date: dateFilter },
      select: { amount: true, method: true },
    });

    // Expenses query
    expect(mockPrisma.expense.findMany).toHaveBeenCalledWith({
      where: { date: dateFilter },
      select: { amount: true, paymentMethod: true },
    });
  });
});
