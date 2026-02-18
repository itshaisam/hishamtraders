import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpenseReport, useExpensesTrend } from '../../../hooks/useReports';
import { useExpenseSummary } from '../../../hooks/useExpenses';
import { exportPDF, exportExcel as exportExcelClient, ExportOptions } from '../../../utils/exportReport';
import { useExportExcel } from '../../../hooks/useExportExcel';
import ExportButtons from '../components/ExportButtons';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const CATEGORY_DISPLAY: Record<string, string> = {
  RENT: 'Rent',
  UTILITIES: 'Utilities',
  SALARIES: 'Salaries',
  SUPPLIES: 'Supplies',
  MAINTENANCE: 'Maintenance',
  MARKETING: 'Marketing',
  TRANSPORT: 'Transport',
  MISC: 'Miscellaneous',
};

const METHOD_DISPLAY: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
};

type Tab = 'detail' | 'by-category' | 'trend';

export default function ExpenseReportPage() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const formatRs = (n: number) => formatCurrencyDecimal(n, cs);
  const { exportExcel, isExporting } = useExportExcel();
  const [tab, setTab] = useState<Tab>('detail');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const detailQuery = useExpenseReport({ dateFrom, dateTo, category: category || undefined, page, limit: 50 });
  const summaryQuery = useExpenseSummary(dateFrom, dateTo);
  const trendQuery = useExpensesTrend();

  const handleExportPDF = () => {
    const dateLabel = `${format(new Date(dateFrom), 'dd MMM yyyy')} — ${format(new Date(dateTo), 'dd MMM yyyy')}`;
    let opts: ExportOptions | null = null;

    if (tab === 'detail' && detailQuery.data) {
      const filters = [{ label: 'Period', value: dateLabel }];
      if (category) filters.push({ label: 'Category', value: CATEGORY_DISPLAY[category] || category });

      opts = {
        title: 'Expense Report — Detail',
        filename: `expense-report-${dateFrom}-to-${dateTo}`,
        filters,
        summary: [
          { label: 'Total Expenses', value: formatRs(detailQuery.data.summary.totalExpenses) },
          { label: 'Count', value: String(detailQuery.data.summary.count) },
          { label: 'Average', value: formatRs(detailQuery.data.summary.average) },
        ],
        columns: [
          { header: 'Date', key: 'date', format: (v) => format(new Date(v), 'dd MMM yyyy') },
          { header: 'Category', key: 'category', format: (v) => CATEGORY_DISPLAY[v] || v },
          { header: 'Description', key: 'description' },
          { header: 'Amount', key: 'amount', align: 'right', format: (v) => formatRs(v) },
          { header: 'Method', key: 'paymentMethod', format: (v) => METHOD_DISPLAY[v] || v },
          { header: 'Recorded By', key: 'recordedBy' },
        ],
        data: detailQuery.data.data,
      };
    } else if (tab === 'by-category' && summaryQuery.data) {
      opts = {
        title: 'Expense Report — By Category',
        filename: `expense-by-category-${dateFrom}-to-${dateTo}`,
        filters: [{ label: 'Period', value: dateLabel }],
        summary: [{ label: 'Total', value: formatRs(summaryQuery.data.totalExpenses) }],
        columns: [
          { header: 'Category', key: 'category', format: (v) => CATEGORY_DISPLAY[v] || v },
          { header: 'Amount', key: 'total', align: 'right', format: (v) => formatRs(v) },
          { header: '% of Total', key: 'total', align: 'right', format: (v) => summaryQuery.data!.totalExpenses > 0 ? `${((v / summaryQuery.data!.totalExpenses) * 100).toFixed(1)}%` : '0%' },
        ],
        data: summaryQuery.data.byCategory || [],
      };
    } else if (tab === 'trend' && trendQuery.data) {
      opts = {
        title: 'Expense Trend — Last 12 Months',
        filename: `expense-trend-${new Date().toISOString().slice(0, 10)}`,
        columns: [
          { header: 'Month', key: 'month' },
          { header: 'Total', key: 'total', align: 'right', format: (v) => formatRs(v) },
        ],
        data: trendQuery.data.data,
      };
    }
    if (opts) exportPDF(opts);
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.set('dateFrom', dateFrom);
    params.set('dateTo', dateTo);

    if (tab === 'detail') {
      if (category) params.set('category', category);
      exportExcel(`/reports/expenses/export?${params.toString()}`, 'expense-report');
    } else if (tab === 'by-category') {
      exportExcel(`/reports/expenses-by-category/export?${params.toString()}`, 'expenses-by-category');
    } else if (tab === 'trend' && trendQuery.data) {
      // Trend has no backend export — use client-side
      exportExcelClient({
        title: 'Expense Trend — Last 12 Months',
        filename: `expense-trend-${new Date().toISOString().slice(0, 10)}`,
        columns: [
          { header: 'Month', key: 'month' },
          { header: 'Total', key: 'total', align: 'right', format: (v: number) => formatRs(v) },
        ],
        data: trendQuery.data.data,
      });
    }
  };

  const hasData =
    (tab === 'detail' && detailQuery.data && detailQuery.data.data.length > 0) ||
    (tab === 'by-category' && summaryQuery.data && (summaryQuery.data.byCategory?.length ?? 0) > 0) ||
    (tab === 'trend' && trendQuery.data && trendQuery.data.data.length > 0);

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: 'Expense Report' }]} className="mb-4" />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Expense Report
          </h1>
          <p className="text-xs text-gray-400 mt-1">Report generated at {new Date().toLocaleString()}</p>
        </div>
        <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={!hasData} isExporting={isExporting} />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        {([['detail', 'Detail'], ['by-category', 'By Category'], ['trend', 'Trend']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Detail Tab */}
      {tab === 'detail' && (
        <>
          <div className="mb-4 p-4 bg-white border rounded-lg flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All</option>
                {Object.entries(CATEGORY_DISPLAY).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          {detailQuery.data?.summary && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Expenses</p>
                <p className="text-xl font-bold text-red-700">{formatRs(detailQuery.data.summary.totalExpenses)}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Count</p>
                <p className="text-xl font-bold">{detailQuery.data.summary.count}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Average</p>
                <p className="text-xl font-bold">{formatRs(detailQuery.data.summary.average)}</p>
              </div>
            </div>
          )}

          {detailQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

          {detailQuery.data && detailQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No expenses found for this period.</div>
          )}

          {detailQuery.data && detailQuery.data.data.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailQuery.data.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(row.date), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-sm">{CATEGORY_DISPLAY[row.category] || row.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{row.description}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatRs(row.amount)}</td>
                        <td className="px-4 py-3 text-sm">{METHOD_DISPLAY[row.paymentMethod] || row.paymentMethod}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detailQuery.data.meta.totalPages > 1 && (
                <div className="px-4 py-3 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">Page {detailQuery.data.meta.page} of {detailQuery.data.meta.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= detailQuery.data.meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* By Category Tab */}
      {tab === 'by-category' && (
        <>
          <div className="mb-4 p-4 bg-white border rounded-lg flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
          </div>

          {!summaryQuery.data && summaryQuery.isLoading && (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          )}

          {summaryQuery.data && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b">
                <h2 className="text-sm font-semibold">
                  Total: {formatRs(summaryQuery.data.totalExpenses)}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summaryQuery.data.byCategory?.map((cat: any) => (
                      <tr key={cat.category} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{CATEGORY_DISPLAY[cat.category] || cat.category}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatRs(cat.total)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${summaryQuery.data.totalExpenses > 0 ? Math.min((cat.total / summaryQuery.data.totalExpenses) * 100, 100) : 0}%` }} />
                            </div>
                            <span className="w-12 text-right">
                              {summaryQuery.data.totalExpenses > 0
                                ? ((cat.total / summaryQuery.data.totalExpenses) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Trend Tab */}
      {tab === 'trend' && (
        <>
          {trendQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

          {trendQuery.data && trendQuery.data.data.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Expense Trend (Last 12 Months)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendQuery.data.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [formatRs(Number(value)), 'Total']} />
                  <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>

              {/* Data table below chart */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trendQuery.data.data.map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{row.month}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{formatRs(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {trendQuery.data && trendQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No expense data available for trend analysis.</div>
          )}
        </>
      )}
    </div>
  );
}
