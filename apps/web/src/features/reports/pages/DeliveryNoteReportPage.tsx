import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumbs, Spinner } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';
import { apiClient as api } from '../../../lib/api-client';

interface DNReportFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  clientId: string;
  warehouseId: string;
  page: number;
}

function useDeliveryNoteReport(filters: DNReportFilters) {
  return useQuery({
    queryKey: ['report-delivery-notes', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.status) params.status = filters.status;
      if (filters.clientId) params.clientId = filters.clientId;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;
      params.page = String(filters.page);
      params.limit = '50';
      const { data } = await api.get('/reports/delivery-notes', { params });
      return data;
    },
  });
}

const STATUS_OPTIONS = ['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

function getStatusVariant(status: string): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'DISPATCHED': return 'info';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    default: return 'default';
  }
}

export const DeliveryNoteReportPage: React.FC = () => {
  const [filters, setFilters] = useState<DNReportFilters>({
    dateFrom: '',
    dateTo: '',
    status: '',
    clientId: '',
    warehouseId: '',
    page: 1,
  });

  const { data: result, isLoading } = useDeliveryNoteReport(filters);

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Reports', href: '/reports' },
          { label: 'Delivery Note Report' },
        ]}
        className="mb-4"
      />

      <h1 className="text-2xl font-bold text-gray-900">Delivery Note Report</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ dateFrom: '', dateTo: '', status: '', clientId: '', warehouseId: '', page: 1 })}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {result?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Delivery Notes</p>
            <p className="text-2xl font-bold text-gray-900">{result.summary.totalNotes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Dispatched</p>
            <p className="text-2xl font-bold text-blue-600">{result.summary.totalDispatched}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Delivered</p>
            <p className="text-2xl font-bold text-green-600">{result.summary.totalDelivered}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Delivery Rate</p>
            <p className="text-2xl font-bold text-gray-900">{result.summary.deliveryRate}%</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold">DN #</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">SO #</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Items</th>
                  <th className="px-4 py-3 text-left font-semibold">Dispatched By</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result?.data?.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/delivery-notes/${row.id}`} className="text-blue-600 hover:underline font-mono">
                        {row.deliveryNoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.clientName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.soNumber}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(row.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.itemCount}</td>
                    <td className="px-4 py-3 text-gray-700">{row.dispatchedBy}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusVariant(row.status)} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {result?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No delivery notes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {result?.pagination && result.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {result.pagination.page} of {result.pagination.totalPages} ({result.pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page >= result.pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
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
