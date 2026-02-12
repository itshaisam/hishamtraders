import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Scale, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useReconciliations, useCreateReconciliation } from '../../../hooks/useReconciliation';
import { useBankAccounts } from '../../../hooks/useBankAccounts';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';

export function BankReconciliationPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newBankId, setNewBankId] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newBalance, setNewBalance] = useState('');

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const { data, isLoading } = useReconciliations({
    status: statusFilter || undefined,
    page,
  });

  const { data: bankAccounts } = useBankAccounts();
  const createMutation = useCreateReconciliation();

  const handleCreate = async () => {
    if (!newBankId || !newDate || !newBalance) {
      toast.error('All fields are required');
      return;
    }

    try {
      const session = await createMutation.mutateAsync({
        bankAccountId: newBankId,
        statementDate: newDate,
        statementBalance: parseFloat(newBalance),
      });
      toast.success('Reconciliation session created');
      setShowCreate(false);
      navigate(`/accounting/bank-reconciliation/${session.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create session');
    }
  };

  const sessions = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Bank Reconciliation
          </h1>
          <p className="text-gray-600 mt-1">Match bank statements to system transactions</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Session
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Statuses</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No reconciliation sessions found. Create one to get started.
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Bank Account</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Statement Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Statement Bal.</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">System Bal.</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Difference</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s: any) => {
                  const diff = s.statementBalance - s.systemBalance;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/accounting/bank-reconciliation/${s.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.bankAccount.code} - {s.bankAccount.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {format(new Date(s.statementDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cs} {s.statementBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cs} {s.systemBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${Math.abs(diff) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
                        {cs} {diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">{s._count?.items || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={s.status === 'COMPLETED' ? 'success' : 'warning'}>
                          {s.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.reconciler?.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: meta.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Reconciliation Session">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
            <select
              value={newBankId}
              onChange={(e) => setNewBankId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Bank Account</option>
              {bankAccounts?.filter((a) => a.code !== '1102').map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.code} - {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statement Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statement Balance</label>
            <input
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
