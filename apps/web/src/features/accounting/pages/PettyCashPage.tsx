import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  usePettyCashBalance,
  usePettyCashTransactions,
  useCreatePettyCashAdvance,
  useBankAccounts,
} from '../../../hooks/useBankAccounts';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import Spinner from '../../../components/ui/Spinner';

export function PettyCashPage() {
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');

  const { data: balance, isLoading: balanceLoading } = usePettyCashBalance();
  const { data: transactions, isLoading: txLoading } = usePettyCashTransactions(50);
  const { data: bankAccounts } = useBankAccounts();
  const createAdvance = useCreatePettyCashAdvance();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  // Filter out petty cash itself (1102) from bank accounts for source selection
  const sourceBanks = bankAccounts?.filter((a) => a.code !== '1102') || [];

  const handleAdvance = async () => {
    const amount = parseFloat(advanceAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!selectedBankId) {
      toast.error('Select a source bank account');
      return;
    }

    try {
      await createAdvance.mutateAsync({ amount, bankAccountId: selectedBankId });
      toast.success('Petty cash advance created');
      setShowAdvanceForm(false);
      setAdvanceAmount('');
      setSelectedBankId('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create advance');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Petty Cash
          </h1>
          <p className="text-gray-600 mt-1">Manage petty cash balance and advances</p>
        </div>
        <button
          onClick={() => setShowAdvanceForm(!showAdvanceForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {showAdvanceForm ? 'Cancel' : 'New Advance'}
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
        <p className="text-sm text-green-600 mb-1">Current Petty Cash Balance</p>
        {balanceLoading ? (
          <Spinner />
        ) : (
          <p className="text-3xl font-bold text-green-900">
            {cs} {(balance?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {/* Advance Form */}
      {showAdvanceForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create Petty Cash Advance</h3>
          <p className="text-sm text-gray-600 mb-4">
            Transfer funds from a bank account to petty cash.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Bank Account <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Bank Account</option>
                {sourceBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.code} - {bank.name} ({cs} {bank.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAdvance}
                disabled={createAdvance.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 w-full"
              >
                {createAdvance.isPending ? 'Creating...' : 'Create Advance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <p className="text-sm text-gray-500">Journal entry lines affecting Petty Cash (1102)</p>
        </div>

        {txLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No transactions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Entry #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Debit</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{tx.entryNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{tx.description}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">
                      {tx.debit > 0
                        ? `${cs} ${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700 font-medium">
                      {tx.credit > 0
                        ? `${cs} ${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
