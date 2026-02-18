import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { reportsService, BalanceSheetSection } from '../../../services/reportsService';

function SectionTable({
  section,
  formatCurrency,
}: {
  section: BalanceSheetSection;
  formatCurrency: (n: number) => string;
}) {
  if (section.accounts.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-700 px-4 py-2 bg-gray-50 border-b">
        {section.label}
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {section.accounts.map((account) => (
            <tr key={account.accountId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-xs text-gray-500 w-20">{account.code}</td>
              <td className="px-4 py-2">{account.name}</td>
              <td className="px-4 py-2 text-right font-mono w-36">
                {formatCurrency(account.balance)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2" colSpan={2}>
              Total {section.label}
            </td>
            <td className="px-4 py-2 text-right font-mono">{formatCurrency(section.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: () => reportsService.getBalanceSheet(asOfDate),
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'Balance Sheet' }]} className="mb-4" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-sm text-gray-500">Assets = Liabilities + Equity</p>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !report ? (
        <div className="text-center py-12 text-gray-500">No data available.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Assets */}
          <Card>
            <SectionTable section={report.assets} formatCurrency={formatCurrency} />
            <div className="px-4 py-3 bg-blue-50 border-t-2 border-blue-200 flex justify-between font-bold text-blue-900">
              <span>Total Assets</span>
              <span className="font-mono">{formatCurrency(report.assets.total)}</span>
            </div>
          </Card>

          {/* Right: Liabilities + Equity */}
          <Card>
            <SectionTable section={report.liabilities} formatCurrency={formatCurrency} />
            <SectionTable section={report.equity} formatCurrency={formatCurrency} />

            {/* Retained Earnings */}
            {report.retainedEarnings !== 0 && (
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between text-sm">
                <span className="italic text-gray-600">Retained Earnings (Net Income)</span>
                <span className="font-mono">{formatCurrency(report.retainedEarnings)}</span>
              </div>
            )}

            <div className="px-4 py-3 bg-blue-50 border-t-2 border-blue-200 flex justify-between font-bold text-blue-900">
              <span>Total Liabilities + Equity</span>
              <span className="font-mono">{formatCurrency(report.totalLiabilitiesAndEquity)}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
