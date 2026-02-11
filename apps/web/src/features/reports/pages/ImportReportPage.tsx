import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { useImportCostReport } from '../../../hooks/useReports';
import { exportPDF, ExportOptions } from '../../../utils/exportReport';
import { useExportExcel } from '../../../hooks/useExportExcel';
import ExportButtons from '../components/ExportButtons';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function ImportReportPage() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const formatRs = (n: number) => formatCurrencyDecimal(n, cs);
  const { exportExcel, isExporting } = useExportExcel();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = useImportCostReport({
    dateFrom,
    dateTo,
    status: status || undefined,
    page,
    limit: 50,
  });

  const handleExportPDF = () => {
    if (!query.data || query.data.data.length === 0) return;
    const dateLabel = `${format(new Date(dateFrom), 'dd MMM yyyy')} — ${format(new Date(dateTo), 'dd MMM yyyy')}`;
    const filters = [{ label: 'Period', value: dateLabel }];
    if (status) filters.push({ label: 'Status', value: status.replace('_', ' ') });

    const opts: ExportOptions = {
      title: 'Import Cost Report',
      filename: `import-report-${dateFrom}-to-${dateTo}`,
      orientation: 'landscape',
      filters,
      summary: [
        { label: 'Total POs', value: String(query.data.summary.totalPOs) },
        { label: 'Product Cost', value: formatRs(query.data.summary.totalProductCost) },
        { label: 'Additional Costs', value: formatRs(query.data.summary.totalShipping + query.data.summary.totalCustoms + query.data.summary.totalTax + query.data.summary.totalOther) },
        { label: 'Total Landed', value: formatRs(query.data.summary.totalLanded) },
      ],
      columns: [
        { header: 'PO #', key: 'poNumber' },
        { header: 'Date', key: 'orderDate', format: (v) => format(new Date(v), 'dd MMM yyyy') },
        { header: 'Supplier', key: 'supplierName' },
        { header: 'Product Cost', key: 'productCost', align: 'right', format: (v) => formatRs(v) },
        { header: 'Shipping', key: 'shipping', align: 'right', format: (v) => v > 0 ? formatRs(v) : '-' },
        { header: 'Customs', key: 'customs', align: 'right', format: (v) => v > 0 ? formatRs(v) : '-' },
        { header: 'Tax', key: 'tax', align: 'right', format: (v) => v > 0 ? formatRs(v) : '-' },
        { header: 'Other', key: 'other', align: 'right', format: (v) => v > 0 ? formatRs(v) : '-' },
        { header: 'Landed Cost', key: 'totalLanded', align: 'right', format: (v) => formatRs(v) },
        { header: 'Status', key: 'status', format: (v) => v.replace('_', ' ') },
      ],
      data: query.data.data,
    };
    exportPDF(opts);
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.set('dateFrom', dateFrom);
    params.set('dateTo', dateTo);
    if (status) params.set('status', status);
    exportExcel(`/reports/imports/export?${params.toString()}`, 'import-cost-report');
  };

  const hasData = query.data && query.data.data.length > 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Import Cost Report
          </h1>
          <p className="text-xs text-gray-400 mt-1">Report generated at {new Date().toLocaleString()}</p>
        </div>
        <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={!hasData} isExporting={isExporting} />
      </div>

      {/* Filters */}
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      {query.data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total POs</p>
            <p className="text-xl font-bold">{query.data.summary.totalPOs}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Product Cost</p>
            <p className="text-xl font-bold">{formatRs(query.data.summary.totalProductCost)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Additional Costs</p>
            <p className="text-xl font-bold text-orange-700">
              {formatRs(query.data.summary.totalShipping + query.data.summary.totalCustoms + query.data.summary.totalTax + query.data.summary.totalOther)}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Landed Cost</p>
            <p className="text-xl font-bold text-blue-700">{formatRs(query.data.summary.totalLanded)}</p>
          </div>
        </div>
      )}

      {query.isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}

      {query.data && query.data.data.length === 0 && (
        <div className="text-center py-12 text-gray-500">No purchase orders found for this period.</div>
      )}

      {query.data && query.data.data.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO #</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shipping</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Customs</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Other</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Landed</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-mono">{row.poNumber}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{format(new Date(row.orderDate), 'dd MMM yyyy')}</td>
                    <td className="px-3 py-3 text-sm font-medium">{row.supplierName}</td>
                    <td className="px-3 py-3 text-sm text-right">{formatRs(row.productCost)}</td>
                    <td className="px-3 py-3 text-sm text-right">{row.shipping > 0 ? formatRs(row.shipping) : '-'}</td>
                    <td className="px-3 py-3 text-sm text-right">{row.customs > 0 ? formatRs(row.customs) : '-'}</td>
                    <td className="px-3 py-3 text-sm text-right">{row.tax > 0 ? formatRs(row.tax) : '-'}</td>
                    <td className="px-3 py-3 text-sm text-right">{row.other > 0 ? formatRs(row.other) : '-'}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold">{formatRs(row.totalLanded)}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[row.status] || ''}`}>
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t font-bold">
                  <td className="px-3 py-3 text-sm" colSpan={3}>Total</td>
                  <td className="px-3 py-3 text-sm text-right">{formatRs(query.data.summary.totalProductCost)}</td>
                  <td className="px-3 py-3 text-sm text-right">{formatRs(query.data.summary.totalShipping)}</td>
                  <td className="px-3 py-3 text-sm text-right">{formatRs(query.data.summary.totalCustoms)}</td>
                  <td className="px-3 py-3 text-sm text-right">{formatRs(query.data.summary.totalTax)}</td>
                  <td className="px-3 py-3 text-sm text-right">{formatRs(query.data.summary.totalOther)}</td>
                  <td className="px-3 py-3 text-sm text-right">{formatRs(query.data.summary.totalLanded)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {query.data.meta.totalPages > 1 && (
            <div className="px-4 py-3 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">Page {query.data.meta.page} of {query.data.meta.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= query.data.meta.totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
