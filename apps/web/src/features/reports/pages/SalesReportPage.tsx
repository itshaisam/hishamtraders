import { useState } from 'react';
import { FileText } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { useSalesReport, useSalesByClient, useSalesByProduct } from '../../../hooks/useReports';
import { exportPDF, ExportOptions } from '../../../utils/exportReport';
import { useExportExcel } from '../../../hooks/useExportExcel';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import ExportButtons from '../components/ExportButtons';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  VOIDED: 'bg-gray-100 text-gray-800',
};

type Tab = 'detail' | 'by-client' | 'by-product';

export default function SalesReportPage() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const [tab, setTab] = useState<Tab>('detail');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { exportExcel, isExporting } = useExportExcel();
  const salesQuery = useSalesReport({ dateFrom, dateTo, status: status || undefined, page, limit: 50 });
  const byClientQuery = useSalesByClient({ dateFrom, dateTo });
  const byProductQuery = useSalesByProduct({ dateFrom, dateTo });

  const handleExportPDF = () => {
    const dateLabel = `${format(new Date(dateFrom), 'dd MMM yyyy')} — ${format(new Date(dateTo), 'dd MMM yyyy')}`;
    const filters = [{ label: 'Period', value: dateLabel }];
    if (status) filters.push({ label: 'Status', value: status });

    let opts: ExportOptions | null = null;

    if (tab === 'detail' && salesQuery.data) {
      opts = {
        title: 'Sales Report — Detail',
        filename: `sales-report-${dateFrom}-to-${dateTo}`,
        filters,
        summary: [
          { label: 'Total Invoices', value: String(salesQuery.data.summary.totalInvoices) },
          { label: 'Total Amount', value: formatCurrencyDecimal(salesQuery.data.summary.totalAmount, cs) },
          { label: 'Total Paid', value: formatCurrencyDecimal(salesQuery.data.summary.totalPaid, cs) },
          { label: 'Outstanding', value: formatCurrencyDecimal(salesQuery.data.summary.totalOutstanding, cs) },
        ],
        columns: [
          { header: 'Invoice #', key: 'invoiceNumber' },
          { header: 'Date', key: 'invoiceDate', format: (v) => format(new Date(v), 'dd MMM yyyy') },
          { header: 'Client', key: 'clientName' },
          { header: 'Total', key: 'total', align: 'right', format: (v) => formatCurrencyDecimal(v, cs) },
          { header: 'Paid', key: 'paidAmount', align: 'right', format: (v) => formatCurrencyDecimal(v, cs) },
          { header: 'Outstanding', key: 'outstanding', align: 'right', format: (v) => formatCurrencyDecimal(v, cs) },
          { header: 'Status', key: 'status' },
        ],
        data: salesQuery.data.data,
      };
    } else if (tab === 'by-client' && byClientQuery.data) {
      opts = {
        title: 'Sales Report — By Client',
        filename: `sales-by-client-${dateFrom}-to-${dateTo}`,
        filters,
        columns: [
          { header: 'Client', key: 'clientName' },
          { header: 'Invoices', key: 'invoiceCount', align: 'right' },
          { header: 'Revenue', key: 'revenue', align: 'right', format: (v) => formatCurrencyDecimal(v, cs) },
        ],
        data: byClientQuery.data.data,
      };
    } else if (tab === 'by-product' && byProductQuery.data) {
      opts = {
        title: 'Sales Report — By Product',
        filename: `sales-by-product-${dateFrom}-to-${dateTo}`,
        filters,
        columns: [
          { header: 'SKU', key: 'sku' },
          { header: 'Product', key: 'productName' },
          { header: 'Qty Sold', key: 'qtySold', align: 'right' },
          { header: 'Revenue', key: 'revenue', align: 'right', format: (v) => formatCurrencyDecimal(v, cs) },
        ],
        data: byProductQuery.data.data,
      };
    }
    if (opts) exportPDF(opts);
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.set('dateFrom', dateFrom);
    params.set('dateTo', dateTo);
    if (status) params.set('status', status);

    const endpointMap: Record<Tab, string> = {
      'detail': 'sales',
      'by-client': 'sales-by-client',
      'by-product': 'sales-by-product',
    };
    const endpoint = endpointMap[tab];
    exportExcel(`/reports/${endpoint}/export?${params.toString()}`, `${endpoint}-report`);
  };

  const hasData =
    (tab === 'detail' && salesQuery.data && salesQuery.data.data.length > 0) ||
    (tab === 'by-client' && byClientQuery.data && byClientQuery.data.data.length > 0) ||
    (tab === 'by-product' && byProductQuery.data && byProductQuery.data.data.length > 0);

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: 'Sales Report' }]} className="mb-4" />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Sales Report
          </h1>
          <p className="text-xs text-gray-400 mt-1">Report generated at {new Date().toLocaleString()}</p>
        </div>
        <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={!hasData} isExporting={isExporting} />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        {([['detail', 'Sales Detail'], ['by-client', 'By Client'], ['by-product', 'By Product']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg flex flex-wrap items-end gap-4">
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
        {tab === 'detail' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        )}
      </div>

      {/* Sales Detail Tab */}
      {tab === 'detail' && (
        <>
          {salesQuery.data?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Invoices</p>
                <p className="text-xl font-bold">{salesQuery.data.summary.totalInvoices}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrencyDecimal(salesQuery.data.summary.totalAmount, cs)}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Paid</p>
                <p className="text-xl font-bold text-green-700">{formatCurrencyDecimal(salesQuery.data.summary.totalPaid, cs)}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Outstanding</p>
                <p className="text-xl font-bold text-red-700">{formatCurrencyDecimal(salesQuery.data.summary.totalOutstanding, cs)}</p>
              </div>
            </div>
          )}

          {salesQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

          {salesQuery.data && salesQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No invoices found for this period.</div>
          )}

          {salesQuery.data && salesQuery.data.data.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesQuery.data.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{row.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(row.invoiceDate), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-sm font-medium">{row.clientName}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrencyDecimal(row.total, cs)}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-700">{formatCurrencyDecimal(row.paidAmount, cs)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrencyDecimal(row.outstanding, cs)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[row.status] || ''}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {salesQuery.data.meta.totalPages > 1 && (
                <div className="px-4 py-3 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-500">Page {salesQuery.data.meta.page} of {salesQuery.data.meta.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= salesQuery.data.meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* By Client Tab */}
      {tab === 'by-client' && (
        <>
          {byClientQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}
          {byClientQuery.data && byClientQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No sales data for this period.</div>
          )}
          {byClientQuery.data && byClientQuery.data.data.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byClientQuery.data.data.map((row) => (
                      <tr key={row.clientId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{row.clientName}</td>
                        <td className="px-4 py-3 text-sm text-right">{row.invoiceCount}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrencyDecimal(row.revenue, cs)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t font-bold">
                      <td className="px-4 py-3 text-sm">Total</td>
                      <td className="px-4 py-3 text-sm text-right">{byClientQuery.data.data.reduce((s, r) => s + r.invoiceCount, 0)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrencyDecimal(byClientQuery.data.data.reduce((s, r) => s + r.revenue, 0), cs)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* By Product Tab */}
      {tab === 'by-product' && (
        <>
          {byProductQuery.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}
          {byProductQuery.data && byProductQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No sales data for this period.</div>
          )}
          {byProductQuery.data && byProductQuery.data.data.length > 0 && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byProductQuery.data.data.map((row) => (
                      <tr key={row.productId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{row.sku}</td>
                        <td className="px-4 py-3 text-sm font-medium">{row.productName}</td>
                        <td className="px-4 py-3 text-sm text-right">{row.qtySold}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrencyDecimal(row.revenue, cs)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t font-bold">
                      <td className="px-4 py-3 text-sm" colSpan={2}>Total</td>
                      <td className="px-4 py-3 text-sm text-right">{byProductQuery.data.data.reduce((s, r) => s + r.qtySold, 0)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrencyDecimal(byProductQuery.data.data.reduce((s, r) => s + r.revenue, 0), cs)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
