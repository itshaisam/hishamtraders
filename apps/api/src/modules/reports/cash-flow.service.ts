export class CashFlowService {
  constructor(private prisma: any) {}

  /**
   * Get cash flow report for a date range (Story 3.8)
   * IN = client payments, OUT = supplier payments + expenses
   */
  async getCashFlowReport(dateFrom: Date, dateTo: Date) {
    const dateFilter = { gte: dateFrom, lte: dateTo };

    const [clientPayments, supplierPayments, expenses] = await Promise.all([
      this.prisma.payment.findMany({
        where: { paymentType: 'CLIENT', date: dateFilter },
        select: { amount: true, method: true },
      }),
      this.prisma.payment.findMany({
        where: { paymentType: 'SUPPLIER', date: dateFilter },
        select: { amount: true, method: true },
      }),
      this.prisma.expense.findMany({
        where: { date: dateFilter },
        select: { amount: true, paymentMethod: true },
      }),
    ]);

    const totalCashIn = clientPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount.toString()),
      0
    );
    const totalSupplierOut = supplierPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount.toString()),
      0
    );
    const totalExpenseOut = expenses.reduce(
      (sum: number, e: any) => sum + parseFloat(e.amount.toString()),
      0
    );
    const totalCashOut = totalSupplierOut + totalExpenseOut;

    // Group by payment method
    const methods: Record<string, { cashIn: number; cashOut: number }> = {
      CASH: { cashIn: 0, cashOut: 0 },
      BANK_TRANSFER: { cashIn: 0, cashOut: 0 },
      CHEQUE: { cashIn: 0, cashOut: 0 },
    };

    clientPayments.forEach((p: any) => {
      methods[p.method].cashIn += parseFloat(p.amount.toString());
    });
    supplierPayments.forEach((p: any) => {
      methods[p.method].cashOut += parseFloat(p.amount.toString());
    });
    expenses.forEach((e: any) => {
      methods[e.paymentMethod].cashOut += parseFloat(e.amount.toString());
    });

    return {
      dateFrom,
      dateTo,
      totalCashIn,
      totalCashOut,
      totalSupplierPayments: totalSupplierOut,
      totalExpenses: totalExpenseOut,
      netCashFlow: totalCashIn - totalCashOut,
      byPaymentMethod: Object.entries(methods).map(([method, data]) => ({
        method,
        cashIn: data.cashIn,
        cashOut: data.cashOut,
        net: data.cashIn - data.cashOut,
      })),
    };
  }
}
