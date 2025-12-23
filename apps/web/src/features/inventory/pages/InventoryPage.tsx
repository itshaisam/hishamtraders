import React, { useState, useMemo } from 'react';
import { Search, Package, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { useGroupedInventory } from '@/hooks/useInventory';
import { useWarehousesForSelect } from '@/hooks/useWarehouses';
import { Breadcrumbs } from '@/components/ui';
import { StockStatus } from '@/types/inventory.types';
import { InventoryInfoBanner } from '../components/InventoryInfoBanner';
import { format } from 'date-fns';

export const InventoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | ''>('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useGroupedInventory({
    search: searchTerm,
    warehouseId: warehouseFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit: 50,
  });

  const { options: warehouseOptions } = useWarehousesForSelect();

  const inventory = useMemo(() => data?.data || [], [data]);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusBadgeColor = (status: StockStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <Breadcrumbs items={[{ label: 'Inventory' }]} className="text-xs sm:text-sm" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Levels</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Real-time inventory tracking across all warehouses
            </p>
            <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
              <Lightbulb size={14} className="text-yellow-500" />
              <span>Tip: Inventory is automatically updated when you receive goods from Purchase Orders</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package size={16} />
            <span>Auto-refreshes every minute</span>
          </div>
        </div>

        {/* Info Banner - Show when inventory is empty */}
        {!isLoading && inventory.length === 0 && <InventoryInfoBanner />}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by SKU or product name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Warehouses</option>
            {warehouseOptions.map((warehouse) => (
              <option key={warehouse.value} value={warehouse.value}>
                {warehouse.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StockStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading && inventory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Loading inventory...</div>
          ) : inventory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No inventory found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      {/* Expand icon column */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Main Row */}
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleExpand(item.id)}
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {expandedRows.has(item.id) ? (
                            <ChevronDown size={18} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={18} className="text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {item.productVariant?.sku || item.product.sku}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{item.product.name}</div>
                          {item.productVariant && (
                            <div className="text-xs text-gray-500">{item.productVariant.variantName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.warehouse.name}</div>
                          {item.warehouse.city && (
                            <div className="text-xs text-gray-500 capitalize">{item.warehouse.city}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">{item.totalQuantity}</div>
                          <div className="text-xs text-gray-500">
                            Reorder: {item.product.reorderLevel}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              item.status
                            )}`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-500">{formatDate(item.lastUpdated)}</div>
                        </td>
                      </tr>

                      {/* Expanded Batch Details Rows */}
                      {expandedRows.has(item.id) &&
                        item.batches.map((batch, index) => (
                          <tr key={`${item.id}-batch-${index}`} className="bg-blue-50">
                            <td className="px-3 py-3"></td>
                            <td colSpan={2} className="px-6 py-3">
                              <div className="pl-8 text-sm text-gray-700">
                                <span className="font-semibold text-gray-600">Batch:</span>{' '}
                                <span className="font-mono">{batch.batchNo}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-sm text-gray-600">
                                {batch.binLocation || (
                                  <span className="text-gray-400 italic">No bin location</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="text-sm font-medium text-gray-900">{batch.quantity}</div>
                            </td>
                            <td className="px-6 py-3" colSpan={2}>
                              <div className="text-xs text-gray-500">
                                Received: {format(new Date(batch.createdAt), 'PPp')}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              Showing page {data.page} of {data.totalPages} (
              {data.total} total items)
            </p>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
