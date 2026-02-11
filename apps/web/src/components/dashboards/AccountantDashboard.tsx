import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  CreditCard,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiClient } from '../../lib/api-client';
import { Card, Spinner } from '../ui';
import { useCurrencySymbol } from '../../hooks/useSettings';
import { formatCurrencyCompact, formatChartValue } from '../../lib/formatCurrency';

interface RecentPayment {
  id: string;
  type: 'CLIENT' | 'SUPPLIER';
  name: string;
  amount: number;
  method: string;
  reference: string | null;
  date: string;
}

interface CashFlowPoint {
  date: string;
  inflow: number;
  outflow: number;
}

interface AgingBuckets {
  current: number;
  days1to7: number;
  days8to30: number;
  days30plus: number;
}

interface AccountantStats {
  cashInflow: number;
  cashOutflow: number;
  totalReceivables: number;
  totalPayables: number;
  pendingPayments: number;
  monthRevenue: number;
  monthExpenses: number;
  receivablesAging: AgingBuckets;
  recentPayments: RecentPayment[];
  cashFlowTrend: CashFlowPoint[];
}

export default function AccountantDashboard() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: stats, isLoading, dataUpdatedAt } = useQuery<AccountantStats>({
    queryKey: ['accountant-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/accountant/stats');
      return response.data.data;
    },
    staleTime: 120000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  if (!stats) return null;

  const netCashFlow = stats.cashInflow - stats.cashOutflow;
  const agingTotal = stats.receivablesAging.current + stats.receivablesAging.days1to7 + stats.receivablesAging.days8to30 + stats.receivablesAging.days30plus;
  const netProfit = stats.monthRevenue - stats.monthExpenses;
  const profitMargin = stats.monthRevenue > 0 ? ((netProfit / stats.monthRevenue) * 100).toFixed(1) : '0.0';

  const agingData = [
    { label: 'Current', amount: stats.receivablesAging.current, color: 'bg-green-500', textColor: 'text-green-600' },
    { label: '1-7 Days', amount: stats.receivablesAging.days1to7, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: '8-30 Days', amount: stats.receivablesAging.days8to30, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { label: '30+ Days', amount: stats.receivablesAging.days30plus, color: 'bg-red-500', textColor: 'text-red-600' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accountant Dashboard</h1>
          <p className="text-gray-600">Financial overview, receivables, payables, and cash flow</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={14} className="mr-1" />
          Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Cash Inflow</div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrencyCompact(stats.cashInflow, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">Monthly collections</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Cash Outflow</div>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrencyCompact(stats.cashOutflow, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">Payments + expenses</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Net Cash Flow</div>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netCashFlow >= 0 ? '+' : ''}{formatCurrencyCompact(Math.abs(netCashFlow), cs)}
          </div>
          <div className="text-xs text-gray-500 mt-2">This month</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Receivables</div>
            <ArrowUpRight className="text-orange-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-orange-600">{formatCurrencyCompact(stats.totalReceivables, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">Outstanding from clients</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Payables</div>
            <ArrowDownRight className="text-purple-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-purple-600">{formatCurrencyCompact(stats.totalPayables, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">Outstanding to suppliers</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Pending Invoices</div>
            <CreditCard className="text-yellow-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</div>
          <div className="text-xs text-gray-500 mt-2">Awaiting payment</div>
        </div>
      </div>

      {/* Cash Flow Trend Chart */}
      <Card className="rounded-xl mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Cash Flow Trend (Last 7 Days)
        </h3>
        {stats.cashFlowTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.cashFlowTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(val: string) => {
                  const d = new Date(val + 'T00:00:00');
                  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
                }}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis tickFormatter={formatChartValue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(value, name) => [
                  `${cs} ${Number(value).toLocaleString()}`,
                  name === 'inflow' ? 'Cash In' : 'Cash Out',
                ]}
                labelFormatter={(label) => {
                  const d = new Date(String(label) + 'T00:00:00');
                  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
                }}
              />
              <Legend formatter={(value) => (value === 'inflow' ? 'Cash In' : 'Cash Out')} />
              <Bar dataKey="inflow" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            No cash flow data for the last 7 days
          </div>
        )}
      </Card>

      {/* Two Column: Receivables Aging + Revenue vs Expenses */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Receivables Aging */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Receivables Aging
          </h3>
          <div className="space-y-4">
            {agingData.map(bucket => {
              const pct = agingTotal > 0 ? (bucket.amount / agingTotal) * 100 : 0;
              return (
                <div key={bucket.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{bucket.label}</span>
                    <span className={`font-semibold ${bucket.textColor}`}>
                      {formatCurrencyCompact(bucket.amount, cs)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bucket.color} rounded-full transition-all`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {agingTotal > 0 && (
              <div className="pt-3 border-t text-sm text-gray-600 flex justify-between">
                <span>Total Outstanding</span>
                <span className="font-bold text-gray-900">{formatCurrencyCompact(agingTotal, cs)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Revenue vs Expenses */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Revenue vs Expenses (This Month)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Revenue</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrencyCompact(stats.monthRevenue, cs)}</div>
              </div>
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Expenses</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrencyCompact(stats.monthExpenses, cs)}</div>
              </div>
              <TrendingDown className="text-red-400" size={24} />
            </div>
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${netProfit >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
              <div>
                <div className="text-sm text-gray-600">Net Profit</div>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{formatCurrencyCompact(Math.abs(netProfit), cs)}
                </div>
              </div>
              <div className={`font-semibold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin}% margin
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card className="rounded-xl mb-8" padding="none">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
        </div>
        {stats.recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(payment.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        payment.type === 'CLIENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.type === 'CLIENT' ? 'IN' : 'OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{payment.name}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {formatCurrencyCompact(payment.amount, cs)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{payment.method.replace('_', ' ')}</td>
                    <td className="px-6 py-3 text-gray-500">{payment.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No recent payments
          </div>
        )}
      </Card>

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
            to="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            <FileText size={16} />
            View Expenses
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <BarChart3 size={16} />
            Cash Flow Report
          </Link>
        </div>
      </Card>
    </div>
  );
}
