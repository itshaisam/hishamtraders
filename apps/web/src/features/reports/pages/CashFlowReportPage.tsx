import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react';
import { useCashFlowReport } from '../../../hooks/usePayments';
import { format, startOfMonth } from 'date-fns';

const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
};

export default function CashFlowReportPage() {
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading, error } = useCashFlowReport(dateFrom, dateTo);
  const report = data?.data;

  const formatRs = (amount: number) =>
    `Rs ${Math.abs(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Cash Flow Report
        </h1>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-400 pb-2">
            {dateFrom && dateTo && `${format(new Date(dateFrom), 'dd MMM yyyy')} — ${format(new Date(dateTo), 'dd MMM yyyy')}`}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
          Failed to load cash flow report. Please try again.
        </div>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Cash In */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Cash In</p>
              </div>
              <p className="text-xl font-bold text-green-700">{formatRs(report.totalCashIn)}</p>
              <p className="text-xs text-gray-500 mt-1">From client payments</p>
            </div>

            {/* Total Cash Out */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Cash Out</p>
              </div>
              <p className="text-xl font-bold text-red-700">{formatRs(report.totalCashOut)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Suppliers: {formatRs(report.totalSupplierPayments)} | Expenses: {formatRs(report.totalExpenses)}
              </p>
            </div>

            {/* Net Cash Flow */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${report.netCashFlow >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  {report.netCashFlow >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Net Cash Flow</p>
              </div>
              <p className={`text-xl font-bold ${report.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {report.netCashFlow >= 0 ? '+' : '-'}{formatRs(report.netCashFlow)}
              </p>
              <p className="text-xs text-gray-500 mt-1">IN - OUT</p>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Minus className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Expenses</p>
              </div>
              <p className="text-xl font-bold text-purple-700">{formatRs(report.totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">Operating expenses</p>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Breakdown by Payment Method</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cash In</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Out</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.byPaymentMethod.map((row) => (
                    <tr key={row.method} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {PAYMENT_METHOD_DISPLAY[row.method] || row.method}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-700 font-medium">
                        {row.cashIn > 0 ? `+${formatRs(row.cashIn)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-700 font-medium">
                        {row.cashOut > 0 ? `-${formatRs(row.cashOut)}` : '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${
                        row.net >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>
                        {row.net >= 0 ? '+' : '-'}{formatRs(row.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200 font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm text-right text-green-700">
                      +{formatRs(report.totalCashIn)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-700">
                      -{formatRs(report.totalCashOut)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${
                      report.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      {report.netCashFlow >= 0 ? '+' : '-'}{formatRs(report.netCashFlow)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
