import { Landmark } from 'lucide-react';
import { useBankAccounts } from '../../../hooks/useBankAccounts';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { ListPageSkeleton, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

export function BankAccountsPage() {
  const { data: accounts, isLoading } = useBankAccounts();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const totalBalance = accounts?.reduce((sum, a) => sum + a.currentBalance, 0) || 0;

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Accounting', href: '/accounting/chart-of-accounts' }, { label: 'Bank Accounts' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Landmark className="h-6 w-6" />
          Bank Accounts
        </h1>
        <p className="text-gray-600 mt-1">View all bank and cash accounts with current balances</p>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-600">Total Balance (All Accounts)</p>
        <p className="text-2xl font-bold text-blue-900">
          {cs} {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No bank accounts found. Seed accounts first using Chart of Accounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {account.code}
                </span>
                {account.isSystemAccount && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    System
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{account.name}</h3>
              <p className="text-xl font-bold text-gray-900">
                {cs} {account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
