import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingDown, TrendingUp, CreditCard, PieChart, BarChart3 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export default function AccountantDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['accountant-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/accountant/stats');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accountant Dashboard</h1>
        <p className="text-gray-600">Financial overview, receivables, payables, and cash flow</p>
      </div>

      {/* Top Metrics - 4 Cards with colored left borders */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Cash Inflow</div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-green-600">
            PKR {stats?.cashInflow?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-2">Monthly collections</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Cash Outflow</div>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-600">
            PKR {stats?.cashOutflow?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-2">Monthly payments</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Net Cash Flow</div>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            PKR {((stats?.cashInflow || 0) - (stats?.cashOutflow || 0)).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">This month</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Pending Payments</div>
            <CreditCard className="text-yellow-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.pendingPayments || 0}</div>
          <div className="text-xs text-gray-500 mt-2">Awaiting processing</div>
        </div>
      </div>

      {/* Financial Summary & Charts */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Revenue vs Expenses
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Revenue (Oct)</div>
                <div className="text-2xl font-bold text-blue-600">PKR 0.0M</div>
              </div>
              <div className="text-green-600 font-semibold">Coming soon</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Expenses (Oct)</div>
                <div className="text-2xl font-bold text-red-600">PKR 0.0M</div>
              </div>
              <div className="text-orange-600 font-semibold">Coming soon</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-500">
              <div>
                <div className="text-sm text-gray-600">Net Profit (Oct)</div>
                <div className="text-2xl font-bold text-green-600">PKR 0.0M</div>
              </div>
              <div className="text-green-600 font-semibold">0% margin</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Receivables Aging
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Current</span>
                <span className="font-semibold">PKR 0.0M (0%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">1-7 Days</span>
                <span className="font-semibold">PKR 0.0M (0%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">8-30 Days</span>
                <span className="font-semibold">PKR 0.0M (0%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">30+ Days</span>
                <span className="font-semibold text-red-600">PKR 0.0M (0%)</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receivables & Payables Summary */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Receivables</h3>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-green-600">
              PKR {stats?.totalReceivables?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-500 mt-2">Total outstanding from clients</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payables</h3>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-red-600">
              PKR {stats?.totalPayables?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-500 mt-2">Total outstanding to suppliers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
