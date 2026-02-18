import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, ListPageSkeleton, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { useAccountHeads } from '../../../hooks/useAccountHeads';
import { reportsService, GeneralLedgerEntry } from '../../../services/reportsService';
import { AccountHead } from '../../../types/accounting.types';

export function GeneralLedgerPage() {
  const [accountHeadId, setAccountHeadId] = useState('');
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: accountsData } = useAccountHeads({ limit: 200 });
  const accounts: AccountHead[] = accountsData?.data || [];

  const { data: report, isLoading } = useQuery({
    queryKey: ['general-ledger', accountHeadId, dateFrom, dateTo],
    queryFn: () => reportsService.getGeneralLedger(accountHeadId, dateFrom, dateTo),
    enabled: !!accountHeadId,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'General Ledger' }]} className="mb-4" />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        <p className="text-sm text-gray-500">View transaction history for any account</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Account *</label>
            <select
              value={accountHeadId}
              onChange={(e) => setAccountHeadId(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select an account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Report */}
      {!accountHeadId ? (
        <div className="text-center py-12 text-gray-400">
          Select an account to view its ledger.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !report ? (
        <div className="text-center py-12 text-gray-500">No data available.</div>
      ) : (
        <Card>
          {/* Account Info */}
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div>
              <span className="font-mono text-sm text-gray-500 mr-2">{report.account.code}</span>
              <span className="font-semibold text-gray-900">{report.account.name}</span>
              <span className="ml-2 text-xs text-gray-400">({report.account.accountType})</span>
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(report.dateFrom)} &mdash; {formatDate(report.dateTo)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Entry #</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 w-24">Ref</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600 w-28">Debit</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600 w-28">Credit</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600 w-32">Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance Row */}
                <tr className="bg-blue-50/50 border-b font-medium">
                  <td className="px-4 py-2" colSpan={6}>
                    Opening Balance
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {formatCurrency(report.openingBalance)}
                  </td>
                </tr>

                {report.entries.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-400" colSpan={7}>
                      No transactions in this period.
                    </td>
                  </tr>
                ) : (
                  report.entries.map((entry: GeneralLedgerEntry, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">{formatDate(entry.date)}</td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/accounting/journal-entries/${entry.journalEntryId}`}
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          {entry.entryNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2 max-w-[250px] truncate">{entry.description}</td>
                      <td className="px-4 py-2 text-xs text-gray-400">
                        {entry.referenceType || '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-medium">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold border-t-2">
                  <td className="px-4 py-3" colSpan={4}>
                    Closing Balance
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(report.totalDebits)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(report.totalCredits)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(report.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
