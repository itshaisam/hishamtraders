import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditLogs } from '../../../hooks/useAuditLogs';
import { AuditLogEntry } from '../../../services/auditService';

const ACTION_OPTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VIEW: 'bg-gray-100 text-gray-700',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-yellow-100 text-yellow-800',
};

export function AuditTrailPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, isError } = useAuditLogs({
    page,
    limit: 50,
    action: action || undefined,
    entityType: entityType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderChangedFields = (entry: AuditLogEntry) => {
    if (!entry.changedFields || typeof entry.changedFields !== 'object') {
      return <p className="text-sm text-gray-500 italic">No change details available</p>;
    }

    const fields = entry.changedFields;
    return (
      <div className="space-y-2">
        {Object.entries(fields).map(([field, change]) => (
          <div key={field} className="text-sm">
            <span className="font-medium text-gray-700">{field}:</span>
            {change && typeof change === 'object' && 'old' in change && 'new' in change ? (
              <div className="ml-4 flex gap-4">
                <span className="text-red-600 line-through">{String(change.old ?? 'null')}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="text-green-600">{String(change.new ?? 'null')}</span>
              </div>
            ) : (
              <span className="ml-2 text-gray-600">{JSON.stringify(change)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 mt-1">View all system activity logs</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.filter(Boolean).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entity Type</label>
            <input
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="e.g. Invoice, Product"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Notes</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
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
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-600 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((entry) => (
                    <tr key={entry.id} className="group">
                      <td colSpan={7} className="p-0">
                        <div>
                          <div
                            className="flex items-center cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleRow(entry.id)}
                          >
                            <div className="w-8 py-3 px-3 text-gray-400">
                              {expandedRow === entry.id ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-700 whitespace-nowrap">
                              {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-900">
                              {entry.user?.name || 'Unknown'}
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
                              {entry.entityId ? entry.entityId.substring(0, 8) + '...' : '-'}
                            </div>
                            <div className="py-3 px-3 text-sm text-gray-600 truncate max-w-xs">
                              {entry.notes || '-'}
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {expandedRow === entry.id && (
                            <div className="bg-gray-50 px-8 py-4 border-t">
                              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
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
                                <div className="mb-3 text-sm">
                                  <span className="text-gray-500">Notes: </span>
                                  <span className="text-gray-800">{entry.notes}</span>
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
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span className="flex items-center px-3 py-1 text-sm text-gray-700">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    disabled={page >= data.totalPages}
                    className="flex items-center gap-1 px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={16} />
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
