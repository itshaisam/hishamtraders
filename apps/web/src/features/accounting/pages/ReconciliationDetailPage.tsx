import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Plus, CheckCircle, XCircle, Link2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useReconciliation,
  useUnmatchedTransactions,
  useAddReconciliationItem,
  useDeleteReconciliationItem,
  useMatchItem,
  useUnmatchItem,
  useCompleteReconciliation,
} from '../../../hooks/useReconciliation';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

export function ReconciliationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddItem, setShowAddItem] = useState(false);
  const [matchingItemId, setMatchingItemId] = useState<string | null>(null);
  const [itemDesc, setItemDesc] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemDate, setItemDate] = useState('');

  const { data: session, isLoading } = useReconciliation(id!);
  const { data: unmatchedTx } = useUnmatchedTransactions(id!);
  const addItemMutation = useAddReconciliationItem(id!);
  const deleteItemMutation = useDeleteReconciliationItem(id!);
  const matchMutation = useMatchItem(id!);
  const unmatchMutation = useUnmatchItem(id!);
  const completeMutation = useCompleteReconciliation(id!);

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!session) {
    return <div className="p-6 text-center text-gray-500">Session not found</div>;
  }

  const isEditable = session.status === 'IN_PROGRESS';
  const matchedCount = session.items.filter((i) => i.matched).length;
  const totalItems = session.items.length;
  const diff = session.statementBalance - session.systemBalance;

  const handleAddItem = async () => {
    if (!itemDesc || !itemAmount || !itemDate) {
      toast.error('All fields are required');
      return;
    }
    try {
      await addItemMutation.mutateAsync({
        description: itemDesc,
        statementAmount: parseFloat(itemAmount),
        statementDate: itemDate,
      });
      toast.success('Statement item added');
      setShowAddItem(false);
      setItemDesc('');
      setItemAmount('');
      setItemDate('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add item');
    }
  };

  const handleMatch = async (journalLineId: string) => {
    if (!matchingItemId) return;
    try {
      await matchMutation.mutateAsync({ itemId: matchingItemId, journalEntryLineId: journalLineId });
      toast.success('Item matched');
      setMatchingItemId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to match');
    }
  };

  const handleUnmatch = async (itemId: string) => {
    try {
      await unmatchMutation.mutateAsync(itemId);
      toast.success('Item unmatched');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to unmatch');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this statement item?')) return;
    try {
      await deleteItemMutation.mutateAsync(itemId);
      toast.success('Item deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleComplete = async () => {
    if (!confirm('Complete this reconciliation? It cannot be modified afterwards.')) return;
    try {
      await completeMutation.mutateAsync();
      toast.success('Reconciliation completed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to complete');
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'Bank Reconciliation', href: '/accounting/bank-reconciliation' }, { label: 'Reconciliation Detail' }]} className="mb-4" />
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/accounting/bank-reconciliation')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Reconciliation: {session.bankAccount.code} - {session.bankAccount.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Statement date: {format(new Date(session.statementDate), 'dd MMM yyyy')}
            {' | '}By: {session.reconciler.name}
          </p>
        </div>
        <Badge variant={session.status === 'COMPLETED' ? 'success' : 'warning'}>
          {session.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Statement Balance</p>
          <p className="text-lg font-bold text-gray-900">
            {cs} {session.statementBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">System Balance</p>
          <p className="text-lg font-bold text-gray-900">
            {cs} {session.systemBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className={`border rounded-lg p-4 ${Math.abs(diff) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-gray-600">Difference</p>
          <p className={`text-lg font-bold ${Math.abs(diff) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
            {cs} {diff.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Matched</p>
          <p className="text-lg font-bold text-gray-900">
            {matchedCount} / {totalItems} items
          </p>
        </div>
      </div>

      {/* Actions */}
      {isEditable && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => { setShowAddItem(true); setItemDate(format(new Date(session.statementDate), 'yyyy-MM-dd')); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Statement Item
          </button>
          <button
            onClick={handleComplete}
            disabled={completeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:bg-gray-400"
          >
            <CheckCircle className="h-4 w-4" />
            {completeMutation.isPending ? 'Completing...' : 'Complete Reconciliation'}
          </button>
        </div>
      )}

      {/* Statement Items */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Statement Items</h3>
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No statement items yet. Add items manually.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Matched To</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {session.items.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${matchingItemId === item.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-900">
                    {format(new Date(item.statementDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.description}</td>
                  <td className={`px-4 py-3 text-right font-medium ${item.statementAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {cs} {item.statementAmount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.matched ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {item.journalEntryLine ? (
                      <span className="font-mono">{item.journalEntryLine.journalEntry.entryNumber}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditable && (
                      <div className="flex items-center justify-center gap-1">
                        {!item.matched ? (
                          <button
                            onClick={() => setMatchingItemId(matchingItemId === item.id ? null : item.id)}
                            className={`p-1 rounded ${matchingItemId === item.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Match to system transaction"
                          >
                            <Link2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnmatch(item.id)}
                            className="p-1 hover:bg-gray-100 text-orange-500 rounded"
                            title="Unmatch"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!item.matched && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-gray-100 text-red-500 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Matching Panel - System Transactions */}
      {matchingItemId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-blue-200">
            <h3 className="font-semibold text-blue-900">
              Select System Transaction to Match
            </h3>
            <p className="text-sm text-blue-600">
              Click a row below to match it to the selected statement item
            </p>
          </div>

          {!unmatchedTx || unmatchedTx.length === 0 ? (
            <div className="text-center py-8 text-blue-600">
              No unmatched system transactions found for this bank account
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-blue-800">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-blue-800">Entry #</th>
                  <th className="px-4 py-3 text-left font-medium text-blue-800">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-blue-800">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-blue-800">Debit</th>
                  <th className="px-4 py-3 text-right font-medium text-blue-800">Credit</th>
                  <th className="px-4 py-3 text-right font-medium text-blue-800">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {unmatchedTx.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-blue-100 cursor-pointer"
                    onClick={() => handleMatch(tx.id)}
                  >
                    <td className="px-4 py-3">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 font-mono text-xs">{tx.entryNumber}</td>
                    <td className="px-4 py-3">{tx.description}</td>
                    <td className="px-4 py-3 text-xs">{tx.referenceType || '-'}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {tx.debit > 0 ? `${cs} ${tx.debit.toFixed(4)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700">
                      {tx.credit > 0 ? `${cs} ${tx.credit.toFixed(4)}` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${tx.netAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {cs} {tx.netAmount.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal isOpen={showAddItem} onClose={() => setShowAddItem(false)} title="Add Statement Item">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Bank transfer from client"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (positive = debit/inflow, negative = credit/outflow)
            </label>
            <input
              type="number"
              step="0.0001"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddItem(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              disabled={addItemMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
