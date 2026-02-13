import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditLogs } from '../../../hooks/useAuditLogs';
import { auditService, AuditLogEntry } from '../../../services/auditService';
import { apiClient } from '../../../lib/api-client';
import { Card, Button, Spinner } from '../../../components/ui';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'];

const ENTITY_TYPE_OPTIONS = [
  'Product', 'Invoice', 'Payment', 'Client', 'Supplier',
  'PurchaseOrder', 'Expense', 'CreditNote', 'Inventory',
  'StockAdjustment', 'StockTransfer', 'GatePass', 'Warehouse',
  'Category', 'Brand', 'User', 'Setting', 'Recovery', 'Alert',
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-gray-100 text-gray-700',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-yellow-100 text-yellow-800',
};

export function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: { id: string; name: string; email: string }[] }>('/users');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useAuditLogs({
    page,
    limit: 50,
    userId: userId || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleUserFilter = (uid: string) => {
    setUserId(uid);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await auditService.exportAuditLogs({
        userId: userId || undefined,
        action: action || undefined,
        entityType: entityType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
      });
      toast.success('Audit logs exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setUserId('');
    setAction('');
    setEntityType('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  const hasFilters = userId || action || entityType || dateFrom || dateTo || search;

  const renderChangedFields = (entry: AuditLogEntry) => {
    if (!entry.changedFields || typeof entry.changedFields !== 'object') {
      return <p className="text-sm text-gray-500 italic">No change details available</p>;
    }

    const fields = entry.changedFields;
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 w-1/3 text-gray-600 font-medium">Field</th>
            <th className="text-left py-2 w-1/3 text-gray-600 font-medium">Old Value</th>
            <th className="text-left py-2 w-1/3 text-gray-600 font-medium">New Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(fields).map(([field, change]) => (
            <tr key={field} className="border-b last:border-0">
              <td className="py-2 font-medium text-gray-700">{field}</td>
              {change && typeof change === 'object' && 'old' in change && 'new' in change ? (
                <>
                  <td className="py-2 text-red-600">{String(change.old ?? 'null')}</td>
                  <td className="py-2 text-green-600">{String(change.new ?? 'null')}</td>
                </>
              ) : (
                <>
                  <td className="py-2 text-gray-400">-</td>
                  <td className="py-2 text-gray-600">{JSON.stringify(change)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-500 mt-1">View all system activity logs</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          icon={<Download size={16} />}
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
            <select
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {(usersData || []).map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {ENTITY_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Entity ID, User, Notes..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={16} className="absolute right-2.5 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Failed to load audit logs</div>
        ) : !data?.items.length ? (
          <div className="text-center py-12 text-gray-500">No audit log entries found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-8 py-3 px-3"></th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Timestamp</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">User</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Action</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Entity Type</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Entity ID</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">IP</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Changed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((entry: AuditLogEntry) => (
                    <tr key={entry.id} className="group">
                      <td colSpan={8} className="p-0">
                        <div>
                          <div
                            className={`flex items-center cursor-pointer hover:bg-gray-50 ${entry.action === 'DELETE' ? 'bg-red-50' : ''}`}
                            onClick={() => toggleRow(entry.id)}
                          >
                            <div className="w-8 py-3 px-3 text-gray-400">
                              {expandedRow === entry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                              {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                            </div>
                            <div className="py-3 px-3 text-sm">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUserFilter(entry.userId); }}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {entry.user?.name || 'Unknown'}
                              </button>
                            </div>
                            <div className="py-3 px-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-700'}`}>
                                {entry.action}
                              </span>
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-700">
                              {entry.entityType}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-500 font-mono text-xs">
                              {entry.entityId ? entry.entityId.substring(0, 12) + '...' : '-'}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-500 text-xs">
                              {entry.ipAddress || '-'}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-600 text-xs">
                              {entry.changedFieldsSummary && entry.changedFieldsSummary.length > 0 ? (
                                <span>
                                  {entry.changedFieldsSummary.slice(0, 3).join(', ')}
                                  {entry.changedFieldsSummary.length > 3 && ` +${entry.changedFieldsSummary.length - 3}`}
                                </span>
                              ) : '-'}
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {expandedRow === entry.id && (
                            <div className="bg-gray-50 px-8 py-4 border-t">
                              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Full Entity ID: </span>
                                  <span className="font-mono text-gray-800">{entry.entityId || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">IP Address: </span>
                                  <span className="text-gray-800">{entry.ipAddress || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">User: </span>
                                  <span className="text-gray-800">{entry.user?.name} ({entry.user?.email})</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">User Agent: </span>
                                  <span className="text-gray-800 text-xs break-all">{entry.userAgent || 'N/A'}</span>
                                </div>
                              </div>
                              {entry.notes && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                                  <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded">{entry.notes}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Changed Fields</p>
                                {renderChangedFields(entry)}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {(data.page - 1) * data.limit + 1} to{' '}
                  {Math.min(data.page * data.limit, data.total)} of {data.total} entries
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="flex items-center px-3 py-1 text-sm text-gray-700">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    disabled={page >= data.totalPages}
                    className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
