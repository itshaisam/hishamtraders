import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingDown, TrendingUp, CreditCard } from 'lucide-react';
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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Accountant Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cash Inflow</p>
              <p className="text-xl font-bold text-green-600">
                ${stats?.cashInflow?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="text-green-600" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cash Outflow</p>
              <p className="text-xl font-bold text-red-600">
                ${stats?.cashOutflow?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingDown className="text-red-600" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Cash Flow</p>
              <p className="text-xl font-bold">
                ${((stats?.cashInflow || 0) - (stats?.cashOutflow || 0)).toFixed(2)}
              </p>
            </div>
            <DollarSign className="text-blue-500" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-xl font-bold">{stats?.pendingPayments || 0}</p>
            </div>
            <CreditCard className="text-yellow-600" size={28} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Record Payment
          </button>
          <button className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
            Record Expense
          </button>
        </div>
      </div>

      {/* Receivables vs Payables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Receivables</h2>
          <p className="text-3xl font-bold text-green-600">
            ${stats?.totalReceivables?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Payables</h2>
          <p className="text-3xl font-bold text-red-600">
            ${stats?.totalPayables?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
}
