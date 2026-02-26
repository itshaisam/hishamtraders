import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { usePurchaseInvoices } from '../../../hooks/usePurchaseInvoices';
import { PurchaseInvoiceStatus, PurchaseInvoiceFilters } from '../../../types/purchase-invoice.types';
import { Button, Breadcrumbs, Spinner } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';

function getStatusBadge(status: PurchaseInvoiceStatus) {
  const map: Record<PurchaseInvoiceStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    PENDING: { label: 'Pending', variant: 'warning' },
    PARTIAL: { label: 'Partial', variant: 'info' },
    PAID: { label: 'Paid', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export const PurchaseInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filters: PurchaseInvoiceFilters = {
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter as PurchaseInvoiceStatus }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    page,
    limit: 20,
  };

  const { data, isLoading } = usePurchaseInvoices(filters);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Purchase Invoices' },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Invoices</h1>
        <Button variant="primary" onClick={() => navigate('/purchase-invoices/new')}>
          <Plus size={16} className="mr-1" /> New Purchase Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="To date"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Spinner /></div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-gray-500">No purchase invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Internal #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Supplier Inv #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Supplier</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">PO #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Outstanding</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((pi) => {
                  const outstanding = Number(pi.total) - Number(pi.paidAmount);
                  return (
                    <tr key={pi.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/purchase-invoices/${pi.id}`} className="text-blue-600 hover:underline font-mono font-medium">
                          {pi.internalNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{pi.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{pi.supplier?.name}</td>
                      <td className="px-4 py-3">
                        {pi.purchaseOrder ? (
                          <Link to={`/purchase-orders/${pi.poId}/view`} className="text-blue-600 hover:underline font-mono text-xs">
                            {pi.purchaseOrder.poNumber}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(pi.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrencyDecimal(Number(pi.total), cs)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrencyDecimal(Number(pi.paidAmount), cs)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrencyDecimal(outstanding, cs)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(pi.status as PurchaseInvoiceStatus)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/purchase-invoices/${pi.id}`)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
