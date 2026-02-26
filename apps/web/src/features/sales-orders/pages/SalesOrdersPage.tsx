import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search } from 'lucide-react';
import { useSalesOrders } from '../../../hooks/useSalesOrders';
import { SalesOrderStatus, SalesOrderFilters } from '../../../types/sales-order.types';
import { Button, Input, Select, Breadcrumbs, Spinner } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PARTIALLY_DELIVERED', label: 'Partially Delivered' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'PARTIALLY_INVOICED', label: 'Partially Invoiced' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'CLOSED', label: 'Closed' },
];

function getStatusBadge(status: SalesOrderStatus) {
  const map: Record<SalesOrderStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    DRAFT: { label: 'Draft', variant: 'default' },
    CONFIRMED: { label: 'Confirmed', variant: 'info' },
    PARTIALLY_DELIVERED: { label: 'Partially Delivered', variant: 'warning' },
    DELIVERED: { label: 'Delivered', variant: 'success' },
    PARTIALLY_INVOICED: { label: 'Partially Invoiced', variant: 'warning' },
    INVOICED: { label: 'Invoiced', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
    CLOSED: { label: 'Closed', variant: 'default' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant} size="sm">{info.label}</Badge>;
}

export const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SalesOrderFilters>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');

  const { data: response, isLoading } = useSalesOrders(filters);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const orders = response?.data || [];
  const pagination = response?.pagination;

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Sales', href: '/sales-orders' },
          { label: 'Sales Orders' },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-600">Manage sales orders and track the sales pipeline</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/sales-orders/new')}>
          <Plus size={16} className="mr-1" />
          New Sales Order
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              placeholder="Search order#, client..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <Search size={16} />
            </button>
          </div>
          <Select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value as SalesOrderStatus) || undefined,
                page: 1,
              }))
            }
            options={STATUS_OPTIONS}
          />
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined, page: 1 }))
            }
            placeholder="From"
          />
          <Input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined, page: 1 }))
            }
            placeholder="To"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No sales orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Order #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Expected Delivery</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{order.client?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.expectedDeliveryDate
                        ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatCurrencyDecimal(Number(order.total), cs)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/sales-orders/${order.id}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                  className={`px-3 py-1 rounded text-sm ${
                    p === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
