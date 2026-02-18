import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Card, Badge, ListPageSkeleton, Modal, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { useJournalEntries, useDeleteJournalEntry, usePostJournalEntry } from '../../../hooks/useJournalEntries';
import { JournalEntry, JournalEntryStatus } from '../../../types/accounting.types';

const STATUS_BADGE: Record<JournalEntryStatus, { variant: 'warning' | 'success'; label: string }> = {
  DRAFT: { variant: 'warning', label: 'Draft' },
  POSTED: { variant: 'success', label: 'Posted' },
};

export function JournalEntriesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [postTarget, setPostTarget] = useState<JournalEntry | null>(null);

  const { data, isLoading } = useJournalEntries({
    search: search || undefined,
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 20,
  });

  const deleteMutation = useDeleteJournalEntry();
  const postMutation = usePostJournalEntry();

  const entries = data?.data || [];
  const meta = data?.meta;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getTotalDebit = (entry: JournalEntry) =>
    entry.lines.reduce((sum, l) => sum + Number(l.debitAmount), 0);

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'Journal Entries' }]} className="mb-4" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-500">Create and manage manual journal entries</p>
        </div>
        <Link
          to="/accounting/journal-entries/new"
          className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} />
          New Entry
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by entry number or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as JournalEntryStatus | ''); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            placeholder="To"
          />
          {(search || statusFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-1">No journal entries found</p>
            <p className="text-sm">Create your first journal entry to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Entry #</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Lines</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Created By</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry: JournalEntry) => {
                    const total = getTotalDebit(entry);
                    const badge = STATUS_BADGE[entry.status];
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{entry.entryNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 max-w-[250px] truncate">{entry.description}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(total)}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{entry.lines.length}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{entry.creator?.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/accounting/journal-entries/${entry.id}`}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="View"
                            >
                              <Eye size={14} />
                            </Link>
                            {entry.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => setPostTarget(entry)}
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="Post"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(entry)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Post Confirmation */}
      {postTarget && (
        <Modal isOpen={!!postTarget} onClose={() => setPostTarget(null)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Post Journal Entry</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to post <strong>{postTarget.entryNumber}</strong>?
              This will update account balances and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPostTarget(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  postMutation.mutate(postTarget.id, {
                    onSuccess: () => setPostTarget(null),
                  });
                }}
                disabled={postMutation.isPending}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {postMutation.isPending ? 'Posting...' : 'Post Entry'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Journal Entry</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteTarget.entryNumber}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
