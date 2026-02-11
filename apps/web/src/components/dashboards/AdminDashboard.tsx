import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Ship,
  Clock,
  Plus,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import WarehouseDashboard from './WarehouseDashboard';
import SalesDashboard from './SalesDashboard';
import AccountantDashboard from './AccountantDashboard';
import RecoveryDashboard from './RecoveryDashboard';

interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userName: string;
  timestamp: string;
  notes: string | null;
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

interface AdminStats {
  stockValue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalReceivables: number;
  totalPayables: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingContainers: number;
  topProducts: TopProduct[];
  recentActivity: ActivityEntry[];
  revenueTrend: RevenueTrendPoint[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const actionColors: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  LOGIN: 'text-purple-600 bg-purple-50',
  LOGOUT: 'text-gray-600 bg-gray-50',
  VIEW: 'text-indigo-600 bg-indigo-50',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const { data: stats, isLoading, dataUpdatedAt } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats');
      return response.data.data;
    },
    staleTime: 300000,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'warehouse', label: 'Warehouse View' },
    { key: 'sales', label: 'Sales View' },
    { key: 'accountant', label: 'Accountant View' },
    { key: 'recovery', label: 'Recovery View' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Complete system overview and business intelligence</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Last Updated */}
          <div className="flex items-center justify-end mb-4 text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
          </div>

          {/* Metric Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Stock Value</div>
                <Package className="text-emerald-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.stockValue, cs)}</div>
              <div className="text-xs text-gray-500 mt-2">Total inventory at cost</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Today's Revenue</div>
                <TrendingUp className="text-blue-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.todayRevenue, cs)}</div>
              <div className="text-xs text-gray-500 mt-2">Invoices today (excl. voided)</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Month's Revenue</div>
                <TrendingUp className="text-indigo-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.monthRevenue, cs)}</div>
              <div className="text-xs text-gray-500 mt-2">Revenue this month</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Receivables</div>
                <DollarSign className="text-orange-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.totalReceivables, cs)}</div>
              <div className="text-xs text-gray-500 mt-2">Outstanding client balances</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Payables</div>
                <DollarSign className="text-red-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.totalPayables, cs)}</div>
              <div className="text-xs text-gray-500 mt-2">Outstanding to suppliers</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-amber-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Stock Alerts</div>
                <AlertTriangle className="text-amber-500" size={20} />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-2xl font-bold text-amber-600">{stats.lowStockCount}</span>
                  <span className="text-xs text-gray-500 ml-1">low</span>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <span className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</span>
                  <span className="text-xs text-gray-500 ml-1">out</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Ship size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">{stats.pendingContainers} containers in transit</span>
              </div>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <Card className="rounded-xl mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
            {stats.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueTrend}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val: string) => {
                      const d = new Date(val + 'T00:00:00');
                      return `${d.getDate()}/${d.getMonth() + 1}`;
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
                      return d.toLocaleDateString('en-PK', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No revenue data for the last 30 days
              </div>
            )}
          </Card>

          {/* Two Column: Top Products + Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Top Products */}
            <Card className="rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Products (This Month)</h3>
              {stats.topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-3 font-medium">Product</th>
                        <th className="pb-3 font-medium text-right">Qty Sold</th>
                        <th className="pb-3 font-medium text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topProducts.map((product, idx) => (
                        <tr key={product.productId} className="border-b last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-400">{product.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-right text-gray-700">{product.quantitySold}</td>
                          <td className="py-3 text-right font-medium text-gray-900">
                            {formatCurrencyCompact(product.revenue, cs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  No sales data this month
                </div>
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {stats.recentActivity.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          actionColors[entry.action] || 'text-gray-600 bg-gray-100'
                        }`}
                      >
                        {entry.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{entry.userName}</span>{' '}
                          <span className="text-gray-500">
                            {entry.action.toLowerCase()}d {entry.entityType}
                          </span>
                        </div>
                        {entry.notes && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{entry.notes}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(entry.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  No recent activity
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="rounded-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/purchase-orders/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                <ShoppingCart size={16} />
                New Purchase Order
              </Link>
              <Link
                to="/invoices/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                <FileText size={16} />
                New Invoice
              </Link>
              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                <Plus size={16} />
                New Product
              </Link>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'warehouse' && <WarehouseDashboard />}
      {activeTab === 'sales' && <SalesDashboard />}
      {activeTab === 'accountant' && <AccountantDashboard />}
      {activeTab === 'recovery' && <RecoveryDashboard />}
    </div>
  );
}
