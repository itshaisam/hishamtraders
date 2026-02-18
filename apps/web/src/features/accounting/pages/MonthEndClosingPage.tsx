import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Lock, Unlock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePeriodCloses, useMonthPnL, useCloseMonth, useReopenPeriod } from '../../../hooks/usePeriodClose';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import Spinner from '../../../components/ui/Spinner';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthEndClosingPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenId, setReopenId] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  const { data: periods, isLoading } = usePeriodCloses();
  const { data: pnl, isLoading: pnlLoading } = useMonthPnL(selectedYear, selectedMonth);
  const closeMutation = useCloseMonth();
  const reopenMutation = useReopenPeriod();

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const handleClose = async () => {
    const monthName = MONTH_NAMES[selectedMonth - 1];
    if (!confirm(`Close ${monthName} ${selectedYear}? This will create a closing journal entry and prevent new transactions in this period.`)) return;
    try {
      await closeMutation.mutateAsync({ year: selectedYear, month: selectedMonth });
      toast.success(`${monthName} ${selectedYear} closed successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to close period');
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    try {
      await reopenMutation.mutateAsync({ id: reopenId, reason: reopenReason.trim() });
      toast.success('Period reopened');
      setShowReopenModal(false);
      setReopenReason('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reopen period');
    }
  };

  // Check if selected month is already closed
  const isSelectedClosed = periods?.some((p) => {
    const d = new Date(p.periodDate);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth && p.status === 'CLOSED';
  });

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'Month-End Closing' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Month-End Closing
        </h1>
        <p className="text-gray-600 mt-1">Close financial periods and view P&L summary</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Select Period</h3>
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            {isSelectedClosed ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                <Lock className="h-4 w-4" />
                Period Closed
              </span>
            ) : (
              <button
                onClick={handleClose}
                disabled={closeMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:bg-gray-400"
              >
                <Lock className="h-4 w-4" />
                {closeMutation.isPending ? 'Closing...' : 'Close Period'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          P&L Summary — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </h3>

        {pnlLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !pnl ? (
          <div className="text-center py-8 text-gray-500">No data available</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Total Revenue
                </p>
                <p className="text-xl font-bold text-green-800">
                  {cs} {pnl.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" /> Total Expenses
                </p>
                <p className="text-xl font-bold text-red-800">
                  {cs} {pnl.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </p>
              </div>
              <div className={`border rounded-lg p-4 ${pnl.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-sm ${pnl.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  Net {pnl.netProfit >= 0 ? 'Profit' : 'Loss'}
                </p>
                <p className={`text-xl font-bold ${pnl.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  {cs} {Math.abs(pnl.netProfit).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </p>
              </div>
            </div>

            {/* Revenue Breakdown */}
            {pnl.revenues.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Revenue</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {pnl.revenues.map((r) => (
                      <tr key={r.code} className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">{r.code}</td>
                        <td className="py-2 text-gray-900">{r.name}</td>
                        <td className="py-2 text-right text-green-700 font-medium">
                          {cs} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Expense Breakdown */}
            {pnl.expenses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Expenses</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {pnl.expenses.map((e) => (
                      <tr key={e.code} className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">{e.code}</td>
                        <td className="py-2 text-gray-900">{e.name}</td>
                        <td className="py-2 text-right text-red-700 font-medium">
                          {cs} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Closed Periods History */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Closed Periods</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !periods || periods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No periods have been closed yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Period</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Net Profit</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Closed By</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Closing JE</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periods.map((p) => {
                const d = new Date(p.periodDate);
                const monthName = MONTH_NAMES[d.getMonth()];
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {monthName} {d.getFullYear()}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${p.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {cs} {Number(p.netProfit).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.status === 'CLOSED' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.closer.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {p.closingJournalEntry?.entryNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(p.createdAt), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'CLOSED' && (
                        <button
                          onClick={() => {
                            setReopenId(p.id);
                            setShowReopenModal(true);
                          }}
                          className="p-1 text-orange-500 hover:bg-orange-50 rounded"
                          title="Reopen period"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reopen Modal */}
      <Modal isOpen={showReopenModal} onClose={() => { setShowReopenModal(false); setReopenReason(''); }} title="Reopen Period">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <p className="text-sm text-orange-800">
              Reopening a period allows new transactions to be created in this period.
              The closing journal entry will remain but can be manually reversed if needed.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for reopening</label>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Explain why this period needs to be reopened..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowReopenModal(false); setReopenReason(''); }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReopen}
              disabled={reopenMutation.isPending}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
            >
              {reopenMutation.isPending ? 'Reopening...' : 'Reopen Period'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
