import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function GatePassReportPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const [page, setPage] = useState(1);

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-dropdown'],
    queryFn: async () => (await apiClient.get('/warehouses?limit=100')).data,
  });
  const warehouses = warehousesData?.data || [];

  // Summary
  const { data: summaryData } = useQuery({
    queryKey: ['gate-pass-report-summary', warehouseId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return (await apiClient.get(`/reports/gate-passes/summary?${params.toString()}`)).data;
    },
  });
  const summary = summaryData?.data;

  // Activity list
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['gate-pass-report-activity', warehouseId, status, purpose, dateFrom, dateTo, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (status) params.set('status', status);
      if (purpose) params.set('purpose', purpose);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));
      params.set('limit', '20');
      return (await apiClient.get(`/reports/gate-passes?${params.toString()}`)).data;
    },
  });
  const gatePasses = activityData?.data || [];
  const pagination = activityData?.pagination;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gate Pass Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Activity and summary reports for gate passes</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{summary.byStatus?.pending || 0}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.byStatus?.approved || 0}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.byStatus?.inTransit || 0}</p>
            <p className="text-xs text-gray-500">In Transit</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.byStatus?.completed || 0}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.byStatus?.cancelled || 0}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>
      )}

      {/* Purpose breakdown */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg font-bold text-gray-700">{summary.byPurpose?.sale || 0}</p>
            <p className="text-xs text-gray-500">Sale</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg font-bold text-gray-700">{summary.byPurpose?.transfer || 0}</p>
            <p className="text-xs text-gray-500">Transfer</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg font-bold text-gray-700">{summary.byPurpose?.return || 0}</p>
            <p className="text-xs text-gray-500">Return</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg font-bold text-gray-700">{summary.byPurpose?.other || 0}</p>
            <p className="text-xs text-gray-500">Other</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1); }}>
              <option value="">All</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={purpose} onChange={(e) => { setPurpose(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="SALE">Sale</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RETURN">Return</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
      ) : gatePasses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No gate passes found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GP #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gatePasses.map((gp: any) => (
                <tr key={gp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{gp.gatePassNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{gp.warehouse?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{gp.purpose}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[gp.status] || ''}`}>
                      {gp.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{gp.issuer?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(gp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-right">{gp.items?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}