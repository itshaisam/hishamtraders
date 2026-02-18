import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../../lib/api-client';
import { Card, Spinner } from '../ui';
import { useCurrencySymbol } from '../../hooks/useSettings';
import { formatCurrencyCompact, formatChartValue } from '../../lib/formatCurrency';

interface TopClient {
  clientId: string;
  name: string;
  revenue: number;
  invoiceCount: number;
}

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  daysOverdue: number;
}

interface CreditAlert {
  clientId: string;
  name: string;
  balance: number;
  creditLimit: number;
  utilization: number;
}

interface WeeklyTrendPoint {
  date: string;
  revenue: number;
  count: number;
}

interface SalesStats {
  todaySalesTotal: number;
  todaySalesCount: number;
  weekSalesTotal: number;
  weekSalesCount: number;
  monthSalesTotal: number;
  monthSalesCount: number;
  topClients: TopClient[];
  overdueInvoices: OverdueInvoice[];
  overdueCount: number;
  overdueTotal: number;
  creditAlerts: CreditAlert[];
  weeklyTrend: WeeklyTrendPoint[];
}

function getOverdueColor(days: number): string {
  if (days > 30) return 'text-red-700 bg-red-50 border-red-200';
  if (days > 14) return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-amber-700 bg-amber-50 border-amber-200';
}

function getUtilizationColor(pct: number): string {
  if (pct > 100) return 'text-red-600';
  if (pct > 90) return 'text-orange-600';
  return 'text-amber-600';
}

export default function SalesDashboard() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: stats, isLoading, dataUpdatedAt } = useQuery<SalesStats>({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/sales/stats');
      return response.data.data;
    },
    staleTime: 180000,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  if (!stats) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
          <p className="text-gray-600">Sales performance, customer management, and revenue tracking</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={14} className="mr-1" />
          Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Today's Sales</div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.todaySalesTotal, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">{stats.todaySalesCount} invoices</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">This Week</div>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.weekSalesTotal, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">{stats.weekSalesCount} invoices</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">This Month</div>
            <DollarSign className="text-indigo-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.monthSalesTotal, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">{stats.monthSalesCount} invoices</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Overdue Invoices</div>
            <AlertTriangle className="text-red-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
          <div className="text-xs text-gray-500 mt-2">{formatCurrencyCompact(stats.overdueTotal, cs)} outstanding</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Credit Alerts</div>
            <CreditCard className="text-orange-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.creditAlerts.length}</div>
          <div className="text-xs text-gray-500 mt-2">Customers &gt;80% credit used</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg. Invoice Value</div>
            <FileText className="text-purple-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.monthSalesCount > 0
              ? formatCurrencyCompact(stats.monthSalesTotal / stats.monthSalesCount, cs)
              : `${cs} 0`}
          </div>
          <div className="text-xs text-gray-500 mt-2">This month average</div>
        </div>
      </div>

      {/* Weekly Sales Trend Chart */}
      <Card className="rounded-xl mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Sales Trend (Last 7 Days)</h3>
        {stats.weeklyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(val: string) => {
                  const d = new Date(val + 'T00:00:00');
                  return d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric' });
                }}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tickFormatter={formatChartValue}
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <Tooltip
                formatter={(value) => [`${cs} ${Number(value).toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => {
                  const d = new Date(String(label) + 'T00:00:00');
                  return d.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'short' });
                }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No sales data for the last 7 days
          </div>
        )}
      </Card>

      {/* Two Column: Top Clients + Overdue Invoices */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Top Clients */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Customers (This Month)</h3>
          {stats.topClients.length > 0 ? (
            <div className="space-y-3">
              {stats.topClients.map((client, idx) => (
                <div key={client.clientId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-7 h-7 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{client.name}</div>
                    <div className="text-xs text-gray-500">{client.invoiceCount} invoices</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{formatCurrencyCompact(client.revenue, cs)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No sales data this month
            </div>
          )}
        </Card>

        {/* Overdue Invoices */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Overdue Invoices
            {stats.overdueCount > 0 && (
              <span className="ml-2 text-sm font-normal text-red-600">({stats.overdueCount})</span>
            )}
          </h3>
          {stats.overdueInvoices.length > 0 ? (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {stats.overdueInvoices.map(inv => (
                <div
                  key={inv.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getOverdueColor(inv.daysOverdue)}`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{inv.invoiceNumber}</div>
                    <div className="text-xs opacity-75">{inv.clientName}</div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-sm font-semibold">{formatCurrencyCompact(inv.outstanding, cs)}</div>
                    <div className="text-xs opacity-75">{inv.daysOverdue}d overdue</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-green-500">
              No overdue invoices
            </div>
          )}
        </Card>
      </div>

      {/* Credit Limit Alerts + Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Credit Limit Alerts */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Credit Limit Alerts
            {stats.creditAlerts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-orange-600">({stats.creditAlerts.length})</span>
            )}
          </h3>
          {stats.creditAlerts.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats.creditAlerts.map(alert => (
                <div key={alert.clientId} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{alert.name}</span>
                    <span className={`text-sm font-bold ${getUtilizationColor(alert.utilization)}`}>
                      {alert.utilization}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        alert.utilization > 100 ? 'bg-red-500' : alert.utilization > 90 ? 'bg-orange-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(alert.utilization, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Balance: {formatCurrencyCompact(alert.balance, cs)}</span>
                    <span>Limit: {formatCurrencyCompact(alert.creditLimit, cs)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-green-500">
              All customers within credit limits
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/invoices/create"
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition border border-blue-200"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">New Invoice</div>
              <div className="text-xs text-gray-600">Create sales invoice</div>
            </Link>
            <Link
              to="/payments/client"
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition border border-green-200"
            >
              <ShoppingCart className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Record Payment</div>
              <div className="text-xs text-gray-600">Customer payment</div>
            </Link>
            <Link
              to="/clients"
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition border border-purple-200"
            >
              <CreditCard className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">View Customers</div>
              <div className="text-xs text-gray-600">Customer management</div>
            </Link>
            <Link
              to="/invoices"
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition border border-orange-200"
            >
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">All Invoices</div>
              <div className="text-xs text-gray-600">Invoice listing</div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
