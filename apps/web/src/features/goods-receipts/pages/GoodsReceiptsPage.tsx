import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search } from 'lucide-react';
import { useGoodsReceipts } from '../hooks/useGoodsReceipts';
import { GRNStatusBadge } from '../components/GRNStatusBadge';
import { Button, Input, Select, Breadcrumbs, Spinner } from '../../../components/ui';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCurrencySymbol } from '@/hooks/useSettings';
import { GRNFilters } from '../types/goods-receipt.types';

export const GoodsReceiptsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<GRNFilters>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');

  const { data: response, isLoading } = useGoodsReceipts(filters);
  const { data: warehousesResponse } = useWarehouses();
  const warehouses = warehousesResponse?.data || [];

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const grns = response?.data || [];
  const pagination = response?.pagination;

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Goods Receipts' },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goods Receipts</h1>
          <p className="text-sm text-gray-600">Manage goods receipt notes (GRNs)</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/goods-receipts/new')}>
          <Plus size={16} className="mr-1" />
          Create Goods Receipt
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              placeholder="Search GRN#, PO#, Supplier..."
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
            value={filters.warehouseId || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, warehouseId: e.target.value || undefined, page: 1 }))}
            options={[
              { value: '', label: 'All Warehouses' },
              ...warehouses.map((w: any) => ({ value: w.id, label: w.name })),
            ]}
          />
          <Select
            value={filters.status || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: (e.target.value as any) || undefined, page: 1 }))}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
              placeholder="From"
            />
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))}
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : grns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No goods receipts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">GRN #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">PO #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Supplier</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Warehouse</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Items</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Total Amount</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn) => (
                  <tr key={grn.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">{grn.grnNumber}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{grn.purchaseOrder?.poNumber || '-'}</td>
                    <td className="px-4 py-3 text-gray-900">{grn.purchaseOrder?.supplier?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{grn.warehouse?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(grn.receivedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{grn.items?.length || 0}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {cs}{' '}
                      {(grn.items || [])
                        .reduce((sum: number, item: any) => sum + item.quantity * (item.poItem?.unitCost || 0), 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GRNStatusBadge status={grn.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/goods-receipts/${grn.id}`)}
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
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
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
