import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Card, Spinner } from '../ui';
import { useCurrencySymbol } from '../../hooks/useSettings';
import { formatCurrencyCompact } from '../../lib/formatCurrency';

interface OverdueClient {
  clientId: string;
  name: string;
  phone: string | null;
  contactPerson: string | null;
  totalOverdue: number;
  overdueInvoiceCount: number;
  oldestDueDate: string;
  daysOverdue: number;
}

interface AgingBucket {
  count: number;
  amount: number;
}

interface RecentCollection {
  id: string;
  clientName: string;
  amount: number;
  method: string;
  date: string;
}

interface RecoveryStats {
  totalOutstanding: number;
  overdueCount: number;
  collectedThisWeek: number;
  collectedThisMonth: number;
  overdueClientsList: OverdueClient[];
  agingBuckets: {
    days1to7: AgingBucket;
    days8to30: AgingBucket;
    days31to60: AgingBucket;
    days60plus: AgingBucket;
  };
  recentCollections: RecentCollection[];
}

function getOverdueSeverity(days: number): { bg: string; text: string; badge: string } {
  if (days > 60) return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  if (days > 30) return { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' };
  if (days > 7) return { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
  return { bg: 'hover:bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' };
}

const paymentMethodIcons: Record<string, string> = {
  CASH: 'text-green-600',
  BANK_TRANSFER: 'text-blue-600',
  CHEQUE: 'text-purple-600',
};

export default function RecoveryDashboard() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: stats, isLoading, dataUpdatedAt } = useQuery<RecoveryStats>({
    queryKey: ['recovery-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/recovery/stats');
      return response.data.data;
    },
    staleTime: 60000,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  if (!stats) return null;

  const agingData = [
    { label: '1-7 Days', ...stats.agingBuckets.days1to7, color: 'bg-yellow-400', borderColor: 'border-yellow-400' },
    { label: '8-30 Days', ...stats.agingBuckets.days8to30, color: 'bg-orange-400', borderColor: 'border-orange-400' },
    { label: '31-60 Days', ...stats.agingBuckets.days31to60, color: 'bg-orange-600', borderColor: 'border-orange-600' },
    { label: '60+ Days', ...stats.agingBuckets.days60plus, color: 'bg-red-600', borderColor: 'border-red-600' },
  ];

  const totalAgingAmount = agingData.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recovery Dashboard</h1>
          <p className="text-gray-600">Overdue accounts, collections tracking, and customer follow-ups</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={14} className="mr-1" />
          Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Outstanding</div>
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrencyCompact(stats.totalOutstanding, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">From all customers</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Overdue Customers</div>
            <Users className="text-orange-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.overdueCount}</div>
          <div className="text-xs text-gray-500 mt-2">Require follow-up</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Collected This Week</div>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrencyCompact(stats.collectedThisWeek, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">Customer payments received</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Collected This Month</div>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrencyCompact(stats.collectedThisMonth, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">Total monthly collections</div>
        </div>
      </div>

      {/* Aging Breakdown */}
      <Card className="rounded-xl mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Overdue Aging Breakdown</h3>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          {agingData.map(bucket => (
            <div key={bucket.label} className={`p-4 rounded-lg border-l-4 ${bucket.borderColor} bg-gray-50`}>
              <div className="text-sm text-gray-600 mb-1">{bucket.label}</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrencyCompact(bucket.amount, cs)}</div>
              <div className="text-xs text-gray-500 mt-1">{bucket.count} invoice{bucket.count !== 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
        {totalAgingAmount > 0 && (
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
            {agingData.map(bucket => {
              const pct = (bucket.amount / totalAgingAmount) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={bucket.label}
                  className={`${bucket.color} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${bucket.label}: ${formatCurrencyCompact(bucket.amount, cs)} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>
        )}
      </Card>

      {/* Two Column: Overdue Clients + Recent Collections */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Overdue Clients Table */}
        <div className="lg:col-span-2">
          <Card className="rounded-xl" padding="none">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                Overdue Customers ({stats.overdueClientsList.length})
              </h3>
            </div>
            {stats.overdueClientsList.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Outstanding</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Days Overdue</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.overdueClientsList.map(client => {
                      const severity = getOverdueSeverity(client.daysOverdue);
                      return (
                        <tr key={client.clientId} className={severity.bg}>
                          <td className="px-6 py-3">
                            <div className="font-medium text-gray-900">{client.name}</div>
                            {client.contactPerson && (
                              <div className="text-xs text-gray-500">{client.contactPerson}</div>
                            )}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{client.phone || '—'}</td>
                          <td className="px-6 py-3 text-right font-semibold text-red-600">
                            {formatCurrencyCompact(client.totalOverdue, cs)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severity.badge}`}>
                              {client.daysOverdue}d
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center text-gray-600">
                            {client.overdueInvoiceCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400">
                No overdue customers
              </div>
            )}
          </Card>
        </div>

        {/* Recent Collections */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Collections</h3>
          {stats.recentCollections.length > 0 ? (
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {stats.recentCollections.map(collection => (
                <div
                  key={collection.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className={`mt-0.5 ${paymentMethodIcons[collection.method] || 'text-gray-600'}`}>
                    <DollarSign size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 truncate">{collection.clientName}</div>
                      <div className="font-semibold text-green-600 whitespace-nowrap ml-2">
                        +{formatCurrencyCompact(collection.amount, cs)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {collection.method.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(collection.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No recent collections
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/payments/client"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            <DollarSign size={16} />
            Record Payment
          </Link>
          <Link
            to="/clients"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            <Users size={16} />
            View Customers
          </Link>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FileText size={16} />
            View Invoices
          </Link>
        </div>
      </Card>
    </div>
  );
}
