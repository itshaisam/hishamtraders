import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, CheckCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, Badge, Spinner, Modal } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import {
  useJournalEntry,
  usePostJournalEntry,
  useDeleteJournalEntry,
} from '../../../hooks/useJournalEntries';
import { JournalEntryStatus } from '../../../types/accounting.types';

const STATUS_BADGE: Record<JournalEntryStatus, { variant: 'warning' | 'success'; label: string }> = {
  DRAFT: { variant: 'warning', label: 'Draft' },
  POSTED: { variant: 'success', label: 'Posted' },
};

export function JournalEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: entry, isLoading } = useJournalEntry(id || '');
  const postMutation = usePostJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 text-center py-12 text-gray-500">
        Journal entry not found.
      </div>
    );
  }

  const totalDebits = entry.lines.reduce((sum, l) => sum + Number(l.debitAmount), 0);
  const totalCredits = entry.lines.reduce((sum, l) => sum + Number(l.creditAmount), 0);
  const badge = STATUS_BADGE[entry.status];
  const isDraft = entry.status === 'DRAFT';

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'Journal Entries', href: '/accounting/journal-entries' }, { label: entry?.entryNumber || 'Detail' }]} className="mb-4" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/accounting/journal-entries')}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{entry.entryNumber}</h1>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-gray-500">{entry.description}</p>
          </div>
        </div>
        {isDraft && (
          <div className="flex items-center gap-2">
            <Link
              to={`/accounting/journal-entries/${entry.id}/edit`}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit2 size={14} />
              Edit
            </Link>
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle size={14} />
              Post Entry
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Entry Info */}
      <Card>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-medium">{formatDate(entry.date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created By</p>
            <p className="text-sm font-medium">{entry.creator?.name}</p>
          </div>
          {entry.approver && (
            <div>
              <p className="text-xs text-gray-500">Approved By</p>
              <p className="text-sm font-medium">{entry.approver.name}</p>
            </div>
          )}
          {entry.referenceType && (
            <div>
              <p className="text-xs text-gray-500">Reference</p>
              <p className="text-sm font-medium">
                {entry.referenceType}{entry.referenceId ? `: ${entry.referenceId}` : ''}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium">{formatDate(entry.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Lines Table */}
      <Card>
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Entry Lines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600 w-8">#</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">Code</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Account</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600 w-20">Type</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600 w-32">Debit</th>
                <th className="text-right px-4 py-2 font-medium text-gray-600 w-32">Credit</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Note</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line, idx) => (
                <tr key={line.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {line.accountHead.code}
                  </td>
                  <td className="px-4 py-2 font-medium">{line.accountHead.name}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs text-gray-500">{line.accountHead.accountType}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {Number(line.debitAmount) > 0 ? formatCurrency(Number(line.debitAmount)) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {Number(line.creditAmount) > 0 ? formatCurrency(Number(line.creditAmount)) : '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{line.description || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3" colSpan={4}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalDebits)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalCredits)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Balanced
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Post Confirmation */}
      {showPostModal && (
        <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Post Journal Entry</h3>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to post <strong>{entry.entryNumber}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This will update account balances (Total: {formatCurrency(totalDebits)}) and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  postMutation.mutate(entry.id, {
                    onSuccess: () => setShowPostModal(false),
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
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Journal Entry</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{entry.entryNumber}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(entry.id, {
                    onSuccess: () => navigate('/accounting/journal-entries'),
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
