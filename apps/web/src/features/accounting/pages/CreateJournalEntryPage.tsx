import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Card, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { useAccountHeads } from '../../../hooks/useAccountHeads';
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useJournalEntry,
} from '../../../hooks/useJournalEntries';
import {
  AccountHead,
  CreateJournalEntryLineDto,
} from '../../../types/accounting.types';

interface LineRow {
  key: number;
  accountHeadId: string;
  debitAmount: string;
  creditAmount: string;
  description: string;
}

const emptyLine = (key: number): LineRow => ({
  key,
  accountHeadId: '',
  debitAmount: '',
  creditAmount: '',
  description: '',
});

export function CreateJournalEntryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [referenceType, setReferenceType] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [lines, setLines] = useState<LineRow[]>([emptyLine(1), emptyLine(2)]);
  const [nextKey, setNextKey] = useState(3);
  const [formLoaded, setFormLoaded] = useState(!isEdit);

  const { data: accountsData, isLoading: accountsLoading } = useAccountHeads({
    status: 'ACTIVE' as any,
    limit: 200,
  });
  const accounts: AccountHead[] = accountsData?.data || [];

  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();

  // Load existing entry for edit mode
  const { isLoading: entryLoading } = useJournalEntry(id || '');
  // We use the hook but handle loading manually
  const { data: existingEntry } = useJournalEntry(id || '');

  // Populate form when entry data loads
  if (isEdit && existingEntry && !formLoaded) {
    setDate(new Date(existingEntry.date).toISOString().split('T')[0]);
    setDescription(existingEntry.description);
    setReferenceType(existingEntry.referenceType || '');
    setReferenceId(existingEntry.referenceId || '');
    const loadedLines = existingEntry.lines.map((l, i) => ({
      key: i + 1,
      accountHeadId: l.accountHeadId,
      debitAmount: Number(l.debitAmount) > 0 ? String(Number(l.debitAmount)) : '',
      creditAmount: Number(l.creditAmount) > 0 ? String(Number(l.creditAmount)) : '',
      description: l.description || '',
    }));
    setLines(loadedLines);
    setNextKey(loadedLines.length + 1);
    setFormLoaded(true);
  }

  const addLine = () => {
    setLines([...lines, emptyLine(nextKey)]);
    setNextKey(nextKey + 1);
  };

  const removeLine = (key: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((l) => l.key !== key));
  };

  const updateLine = (key: number, field: keyof LineRow, value: string) => {
    setLines(
      lines.map((l) => {
        if (l.key !== key) return l;
        const updated = { ...l, [field]: value };
        // If setting debit, clear credit and vice-versa
        if (field === 'debitAmount' && value) updated.creditAmount = '';
        if (field === 'creditAmount' && value) updated.debitAmount = '';
        return updated;
      })
    );
  };

  const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debitAmount) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.creditAmount) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lineData: CreateJournalEntryLineDto[] = lines
      .filter((l) => l.accountHeadId)
      .map((l) => ({
        accountHeadId: l.accountHeadId,
        debitAmount: parseFloat(l.debitAmount) || 0,
        creditAmount: parseFloat(l.creditAmount) || 0,
        description: l.description || null,
      }));

    if (isEdit && id) {
      updateMutation.mutate(
        {
          id,
          data: {
            date,
            description: description.trim(),
            referenceType: referenceType || null,
            referenceId: referenceId || null,
            lines: lineData,
          },
        },
        {
          onSuccess: () => navigate(`/accounting/journal-entries/${id}`),
        }
      );
    } else {
      createMutation.mutate(
        {
          date,
          description: description.trim(),
          referenceType: referenceType || null,
          referenceId: referenceId || null,
          lines: lineData,
        },
        {
          onSuccess: (entry) => navigate(`/accounting/journal-entries/${entry.id}`),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && (entryLoading || !formLoaded)) {
    return (
      <div className="p-6 flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/journal-entries' }, { label: isEdit ? 'Edit Journal Entry' : 'New Journal Entry' }]} className="mb-4" />
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/accounting/journal-entries')}
          className="p-1.5 hover:bg-gray-100 rounded"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Modify the draft journal entry' : 'Create a manual double-entry journal entry'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Header Fields */}
        <Card>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={3}
                maxLength={500}
                placeholder="e.g. Record office rent payment for January 2025"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reference Type</label>
              <input
                type="text"
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                placeholder="e.g. INVOICE, PO"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Reference ID</label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. INV-001"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Lines */}
        <Card>
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Entry Lines</h2>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus size={12} />
              Add Line
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 w-8">#</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Account *</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600 w-36">Debit</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600 w-36">Credit</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Note</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.key} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <select
                        value={line.accountHeadId}
                        onChange={(e) => updateLine(line.key, 'accountHeadId', e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select account...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={line.debitAmount}
                        onChange={(e) => updateLine(line.key, 'debitAmount', e.target.value)}
                        min="0"
                        step="0.0001"
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right font-mono focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={line.creditAmount}
                        onChange={(e) => updateLine(line.key, 'creditAmount', e.target.value)}
                        min="0"
                        step="0.0001"
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right font-mono focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.key, 'description', e.target.value)}
                        placeholder="Optional note"
                        maxLength={500}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td className="px-3 py-2" colSpan={2}>
                    <span className="text-gray-600">Totals</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrency(totalDebits)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrency(totalCredits)}
                  </td>
                  <td className="px-3 py-2" colSpan={2}>
                    {totalDebits > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isBalanced
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isBalanced
                          ? 'Balanced'
                          : `Difference: ${formatCurrency(Math.abs(totalDebits - totalCredits))}`}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate('/accounting/journal-entries')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !isBalanced || !description.trim()}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {isPending ? 'Saving...' : isEdit ? 'Update Entry' : 'Create Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
