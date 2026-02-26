import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search } from 'lucide-react';
import { useDeliveryNotes } from '../../../hooks/useDeliveryNotes';
import { DeliveryNoteStatus, DeliveryNoteFilters } from '../../../types/delivery-note.types';
import { Button, Input, Select, Breadcrumbs, Spinner } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function getStatusBadge(status: DeliveryNoteStatus) {
  const map: Record<DeliveryNoteStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    PENDING: { label: 'Pending', variant: 'warning' },
    DISPATCHED: { label: 'Dispatched', variant: 'info' },
    DELIVERED: { label: 'Delivered', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant} size="sm">{info.label}</Badge>;
}

export const DeliveryNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DeliveryNoteFilters>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');

  const { data: response, isLoading } = useDeliveryNotes(filters);

  const notes = response?.data || [];
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
          { label: 'Delivery Notes' },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Notes</h1>
          <p className="text-sm text-gray-600">Manage delivery notes and warehouse dispatches</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/delivery-notes/new')}>
          <Plus size={16} className="mr-1" />
          New Delivery Note
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              placeholder="Search DN#, client, SO#..."
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
                status: (e.target.value as DeliveryNoteStatus) || undefined,
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
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No delivery notes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">DN #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">SO #</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Items</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((dn) => (
                  <tr key={dn.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-blue-600">
                      {dn.deliveryNoteNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{dn.client?.name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {dn.salesOrder?.orderNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(dn.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {dn._count?.items || dn.items?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(dn.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/delivery-notes/${dn.id}`)}
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
