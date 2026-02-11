import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { usePaymentCollections, useReceivables } from '../../../hooks/useReports';
import { exportPDF, exportExcel, ExportOptions } from '../../../utils/exportReport';
import ExportButtons from '../components/ExportButtons';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';

const METHOD_DISPLAY: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
};

type Tab = 'collections' | 'receivables';

export default function PaymentReportPage() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const formatRs = (n: number) => formatCurrencyDecimal(n, cs);
  const [tab, setTab] = useState<Tab>('collections');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);

  const collectionsQuery = usePaymentCollections({ dateFrom, dateTo, method: method || undefined, page, limit: 50 });
  const receivablesQuery = useReceivables();

  const handleExport = (fmt: 'pdf' | 'excel') => {
    let opts: ExportOptions | null = null;

    if (tab === 'collections' && collectionsQuery.data) {
      const dateLabel = `${format(new Date(dateFrom), 'dd MMM yyyy')} — ${format(new Date(dateTo), 'dd MMM yyyy')}`;
      const filters = [{ label: 'Period', value: dateLabel }];
      if (method) filters.push({ label: 'Method', value: METHOD_DISPLAY[method] || method });

      opts = {
        title: 'Payment Collections Report',
        filename: `payment-collections-${dateFrom}-to-${dateTo}`,
        filters,
        summary: [
          { label: 'Total Collected', value: formatRs(collectionsQuery.data.summary.totalCollected) },
          { label: 'Payment Count', value: String(collectionsQuery.data.summary.count) },
          ...collectionsQuery.data.summary.byMethod.map((m) => ({
            label: METHOD_DISPLAY[m.method] || m.method,
            value: `${formatRs(m.total)} (${m.count})`,
          })),
        ],
        columns: [
          { header: 'Date', key: 'date', format: (v) => format(new Date(v), 'dd MMM yyyy') },
          { header: 'Client', key: 'clientName' },
          { header: 'Amount', key: 'amount', align: 'right', format: (v) => formatRs(v) },
          { header: 'Method', key: 'method', format: (v) => METHOD_DISPLAY[v] || v },
          { header: 'Reference', key: 'referenceNumber', format: (v) => v || '-' },
        ],
        data: collectionsQuery.data.data,
      };
    } else if (tab === 'receivables' && receivablesQuery.data) {
      opts = {
        title: 'Receivables Report',
        filename: `receivables-${new Date().toISOString().slice(0, 10)}`,
        summary: [
          { label: 'Total Receivable', value: formatRs(receivablesQuery.data.data.reduce((s, r) => s + r.balance, 0)) },
          { label: 'Total Overdue', value: formatRs(receivablesQuery.data.data.reduce((s, r) => s + r.overdueAmount, 0)) },
        ],
        columns: [
          { header: 'Client', key: 'clientName' },
          { header: 'Balance', key: 'balance', align: 'right', format: (v) => formatRs(v) },
          { header: 'Credit Limit', key: 'creditLimit', align: 'right', format: (v) => formatRs(v) },
          { header: 'Overdue', key: 'overdueAmount', align: 'right', format: (v) => formatRs(v) },
          { header: 'Days Past Due', key: 'daysPastDue', align: 'right', format: (v) => v > 0 ? `${v} days` : 'Current' },
        ],
        data: receivablesQuery.data.data,
      };
    }
    if (!opts) return;
    fmt === 'pdf' ? exportPDF(opts) : exportExcel(opts);
  };

  const hasData =
    (tab === 'collections' && collectionsQuery.data && collectionsQuery.data.data.length > 0) ||
    (tab === 'receivables' && receivablesQuery.data && receivablesQuery.data.data.length > 0);

  const getAgingColor = (days: number) => {
    if (days === 0) return 'text-green-700 bg-green-100';
    if (days <= 30) return 'text-yellow-700 bg-yellow-100';
    if (days <= 60) return 'text-orange-700 bg-orange-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Payment Report
          </h1>
          <p className="text-xs text-gray-400 mt-1">Report generated at {new Date().toLocaleString()}</p>
        </div>
        <ExportButtons onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('excel')} disabled={!hasData} />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        {([['collections', 'Collections'], ['receivables', 'Receivables']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Collections Tab */}
      {tab === 'collections' && (
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
              <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          {collectionsQuery.data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Collected</p>
                <p className="text-xl font-bold text-green-700">{formatRs(collectionsQuery.data.summary.totalCollected)}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Payment Count</p>
                <p className="text-xl font-bold">{collectionsQuery.data.summary.count}</p>
              </div>
              {collectionsQuery.data.summary.byMethod.map((m) => (
                <div key={m.method} className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">{METHOD_DISPLAY[m.method] || m.method}</p>
                  <p className="text-xl font-bold">{formatRs(m.total)}</p>
                  <p className="text-xs text-gray-400">{m.count} payments</p>
                </div>
              ))}
            </div>
          )}

          {collectionsQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

          {collectionsQuery.data && collectionsQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No payments found for this period.</div>
          )}

          {collectionsQuery.data && collectionsQuery.data.data.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {collectionsQuery.data.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(row.date), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-sm font-medium">{row.clientName}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-700">{formatRs(row.amount)}</td>
                        <td className="px-4 py-3 text-sm">{METHOD_DISPLAY[row.method] || row.method}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{row.referenceNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {collectionsQuery.data.meta.totalPages > 1 && (
                <div className="px-4 py-3 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">Page {collectionsQuery.data.meta.page} of {collectionsQuery.data.meta.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= collectionsQuery.data.meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Receivables Tab */}
      {tab === 'receivables' && (
        <>
          {receivablesQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

          {receivablesQuery.data && receivablesQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No outstanding receivables.</div>
          )}

          {receivablesQuery.data && receivablesQuery.data.data.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Total Receivable</p>
                  <p className="text-xl font-bold text-red-700">
                    {formatRs(receivablesQuery.data.data.reduce((s, r) => s + r.balance, 0))}
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase">Overdue Amount</p>
                  <p className="text-xl font-bold text-red-700">
                    {formatRs(receivablesQuery.data.data.reduce((s, r) => s + r.overdueAmount, 0))}
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit Limit</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overdue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aging</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {receivablesQuery.data.data.map((row) => (
                        <tr key={row.clientId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{row.clientName}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{formatRs(row.balance)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">{formatRs(row.creditLimit)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-700">{formatRs(row.overdueAmount)}</td>
                          <td className="px-4 py-3 text-sm">
                            {row.daysPastDue > 0 ? (
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getAgingColor(row.daysPastDue)}`}>
                                {row.daysPastDue} days
                              </span>
                            ) : (
                              <span className="text-gray-400">Current</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
