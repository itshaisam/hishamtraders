import { useState } from 'react';
import { Package } from 'lucide-react';
import { useStockReport, useStockValuation } from '../../../hooks/useReports';
import { useWarehousesForSelect } from '../../../hooks/useWarehouses';
import { useCategoriesForSelect } from '../../../hooks/useCategories';
import { exportPDF, exportExcel, ExportOptions } from '../../../utils/exportReport';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import ExportButtons from '../components/ExportButtons';

export default function StockReportPage() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const [tab, setTab] = useState<'report' | 'valuation'>('report');
  const [warehouseId, setWarehouseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { options: warehouses } = useWarehousesForSelect();
  const { options: categories } = useCategoriesForSelect();

  const stockQuery = useStockReport({
    warehouseId: warehouseId || undefined,
    categoryId: categoryId || undefined,
    status: status as any,
    page,
    limit: 50,
  });

  const valuationQuery = useStockValuation();

  const buildExportOptions = (format: 'pdf' | 'excel') => {
    const filters = [];
    const wh = warehouses.find((w) => w.value === warehouseId);
    const cat = categories.find((c) => c.value === categoryId);
    if (wh) filters.push({ label: 'Warehouse', value: wh.label });
    if (cat) filters.push({ label: 'Category', value: cat.label });
    if (status !== 'all') filters.push({ label: 'Status', value: status.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) });

    if (tab === 'report' && stockQuery.data) {
      const opts: ExportOptions = {
        title: 'Stock Report',
        filename: `stock-report-${new Date().toISOString().slice(0, 10)}`,
        filters,
        summary: [
          { label: 'Total Items', value: stockQuery.data.summary.totalItems.toLocaleString() },
          { label: 'Total Value', value: formatCurrencyDecimal(stockQuery.data.summary.totalValue, cs) },
        ],
        columns: [
          { header: 'SKU', key: 'sku' },
          { header: 'Product', key: 'productName' },
          { header: 'Category', key: 'categoryName' },
          { header: 'Warehouse', key: 'warehouseName' },
          { header: 'Quantity', key: 'quantity', align: 'right' },
          { header: 'Reorder Lvl', key: 'reorderLevel', align: 'right' },
          { header: 'Value', key: 'value', align: 'right', format: (v) => formatCurrencyDecimal(v, cs) },
          { header: 'Status', key: 'status' },
        ],
        data: stockQuery.data.data,
      };
      return opts;
    }

    if (tab === 'valuation' && valuationQuery.data) {
      return {
        title: 'Stock Valuation',
        filename: `stock-valuation-${new Date().toISOString().slice(0, 10)}`,
        filters,
        columns: [
          { header: 'Category', key: 'categoryName' },
          { header: 'Quantity', key: 'totalQuantity', align: 'right' as const },
          { header: 'Value', key: 'totalValue', align: 'right' as const, format: (v: number) => formatCurrencyDecimal(v, cs) },
          { header: '% of Total', key: 'percentage', align: 'right' as const, format: (v: number) => `${v}%` },
        ],
        data: valuationQuery.data.data,
      };
    }
    return null;
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const opts = buildExportOptions(format);
    if (!opts) return;
    format === 'pdf' ? exportPDF(opts) : exportExcel(opts);
  };

  const hasData = (tab === 'report' && stockQuery.data && stockQuery.data.data.length > 0) ||
    (tab === 'valuation' && valuationQuery.data && valuationQuery.data.data.length > 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Stock Report
          </h1>
          <p className="text-xs text-gray-400 mt-1">Report generated at {new Date().toLocaleString()}</p>
        </div>
        <ExportButtons onExportPDF={() => handleExport('pdf')} onExportExcel={() => handleExport('excel')} disabled={!hasData} />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        {(['report', 'valuation'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t === 'report' ? 'Stock Report' : 'Stock Valuation'}
          </button>
        ))}
      </div>

      {tab === 'report' && (
        <>
          {/* Filters */}
          <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          {stockQuery.data && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Items</p>
                <p className="text-xl font-bold text-gray-900">{stockQuery.data.summary.totalItems.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase">Total Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrencyDecimal(stockQuery.data.summary.totalValue, cs)}</p>
              </div>
            </div>
          )}

          {stockQuery.isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {stockQuery.data && stockQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No stock records found.</div>
          )}

          {stockQuery.data && stockQuery.data.data.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockQuery.data.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{row.sku}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.productName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.categoryName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.warehouseName}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{row.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{row.reorderLevel}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrencyDecimal(row.value, cs)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            row.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                            row.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {stockQuery.data.meta.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Page {stockQuery.data.meta.page} of {stockQuery.data.meta.totalPages} ({stockQuery.data.meta.total} items)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= stockQuery.data.meta.totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'valuation' && (
        <>
          {valuationQuery.isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {valuationQuery.data && valuationQuery.data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No inventory data available.</div>
          )}

          {valuationQuery.data && valuationQuery.data.data.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {valuationQuery.data.data.map((row) => (
                      <tr key={row.categoryId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.categoryName}</td>
                        <td className="px-4 py-3 text-sm text-right">{row.totalQuantity.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrencyDecimal(row.totalValue, cs)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(row.percentage, 100)}%` }} />
                            </div>
                            <span className="w-12 text-right">{row.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200 font-bold">
                      <td className="px-4 py-3 text-sm">Total</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {valuationQuery.data.data.reduce((s, r) => s + r.totalQuantity, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrencyDecimal(valuationQuery.data.data.reduce((s, r) => s + r.totalValue, 0), cs)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">100%</td>
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
