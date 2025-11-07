import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, FileText, Plus, Target, DollarSign } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Card, Spinner } from '../ui';

export default function SalesDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/sales/stats');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
        <p className="text-gray-600">Sales performance, client management, and revenue tracking</p>
      </div>

      {/* Top Metrics - 6 Cards with colored left borders */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Today's Sales</div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            PKR {stats?.todaysSalesTotal?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {stats?.todaysSalesCount || 0} invoices
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Monthly Sales</div>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">PKR 0.0M</div>
          <div className="text-xs text-green-600 mt-2">Coming soon</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Quarterly Target</div>
            <Target className="text-purple-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">0%</div>
          <div className="text-xs text-gray-500 mt-2">PKR 0.0M / 0.0M</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Active Clients</div>
            <Users className="text-orange-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">0</div>
          <div className="text-xs text-gray-500 mt-2">Coming soon</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Credit Warnings</div>
            <TrendingUp className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {stats?.creditLimitAlerts || 0}
          </div>
          <div className="text-xs text-gray-500 mt-2">Clients near limit</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Recent Invoices</div>
            <FileText className="text-indigo-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.recentInvoicesCount || 0}</div>
          <div className="text-xs text-gray-500 mt-2">Last 30 days</div>
        </div>
      </div>

      {/* Quick Actions & Recent Invoices */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition border border-blue-200">
              <Plus className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">New Invoice</div>
              <div className="text-xs text-gray-600">Create sales invoice</div>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition border border-green-200">
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Add Client</div>
              <div className="text-xs text-gray-600">Register new client</div>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition border border-purple-200">
              <FileText className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Check Stock</div>
              <div className="text-xs text-gray-600">Product availability</div>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition border border-orange-200">
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Sales Report</div>
              <div className="text-xs text-gray-600">Download data</div>
            </button>
          </div>
        </Card>

        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Sales Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Daily Target</div>
                <div className="text-xs text-gray-500">PKR 500K</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">0%</div>
                <div className="text-xs text-gray-500">PKR 0.0K</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Monthly Target</div>
                <div className="text-xs text-gray-500">PKR 12M</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">0%</div>
                <div className="text-xs text-gray-500">PKR 0.0M</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      {stats?.recentInvoices && stats.recentInvoices.length > 0 && (
        <Card className="rounded-xl" padding="none">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.client?.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      PKR {invoice.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
