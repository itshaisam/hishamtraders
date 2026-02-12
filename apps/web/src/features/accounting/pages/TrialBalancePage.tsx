import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, Spinner } from '../../../components/ui';
import { reportsService, TrialBalanceRow } from '../../../services/reportsService';

const TYPE_COLORS: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  ASSET: 'info',
  LIABILITY: 'warning',
  EQUITY: 'success',
  REVENUE: 'success',
  EXPENSE: 'danger',
};

export function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['trial-balance', asOfDate],
    queryFn: () => reportsService.getTrialBalance(asOfDate),
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-sm text-gray-500">Verify that debits equal credits across all accounts</p>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <div className="p-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">As of Date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
          {report && (
            <div className="ml-auto">
              {report.isBalanced ? (
                <Badge variant="success">Balanced</Badge>
              ) : (
                <Badge variant="danger">NOT Balanced</Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !report || report.rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-1">No data available</p>
            <p className="text-sm">Post journal entries to see the trial balance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Account</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 w-20">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Opening</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Debits</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Credits</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-32 bg-blue-50">Debit Bal.</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-32 bg-blue-50">Credit Bal.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.rows.map((row: TrialBalanceRow) => (
                  <tr key={row.accountId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{row.code}</td>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant={TYPE_COLORS[row.accountType] || 'default'}>
                        {row.accountType}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-600">
                      {formatCurrency(row.openingBalance)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.totalDebits > 0 ? formatCurrency(row.totalDebits) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.totalCredits > 0 ? formatCurrency(row.totalCredits) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono bg-blue-50/50">
                      {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono bg-blue-50/50">
                      {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold border-t-2">
                  <td className="px-4 py-3" colSpan={4}>Totals</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(report.totals.totalDebits)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(report.totals.totalCredits)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono bg-blue-50">
                    {formatCurrency(report.totals.debitBalanceTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono bg-blue-50">
                    {formatCurrency(report.totals.creditBalanceTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
