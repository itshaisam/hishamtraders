import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGatePasses } from '../../../hooks/useGatePasses';
import { GatePassFilters, GatePassStatus, GatePassPurpose } from '../../../types/gate-pass.types';
import { Badge, Button, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const statusVariants: Record<GatePassStatus, 'warning' | 'info' | 'default' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'info',
  IN_TRANSIT: 'default',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const purposeLabels: Record<GatePassPurpose, string> = {
  SALE: 'Sale',
  TRANSFER: 'Transfer',
  RETURN: 'Return',
  OTHER: 'Other',
};

export default function GatePassListPage() {
  const [filters, setFilters] = useState<GatePassFilters>({ page: 1, limit: 10 });
  const { data, isLoading } = useGatePasses(filters);

  const gatePasses = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Gate Passes' }]} className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Passes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage outbound gate passes for inventory dispatch</p>
        </div>
        <Link to="/gate-passes/new">
          <Button>New Gate Pass</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Gate pass number..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as GatePassStatus | undefined, page: 1 })}
            >
              <option value="">All Statuses</option>
              {Object.values(GatePassStatus).map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.purpose || ''}
              onChange={(e) => setFilters({ ...filters, purpose: (e.target.value || undefined) as GatePassPurpose | undefined, page: 1 })}
            >
              <option value="">All Purposes</option>
              {Object.values(GatePassPurpose).map((p) => (
                <option key={p} value={p}>{purposeLabels[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined, page: 1 })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined, page: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : gatePasses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No gate passes found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GP Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gatePasses.map((gp) => (
                <tr key={gp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
                    <Link to={`/gate-passes/${gp.id}`}>{gp.gatePassNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(gp.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{gp.warehouse.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{purposeLabels[gp.purpose]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{gp.items.length}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariants[gp.status]}>{gp.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{gp.issuer.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/gate-passes/${gp.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
