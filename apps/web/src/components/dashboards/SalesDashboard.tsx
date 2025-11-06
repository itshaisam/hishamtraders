import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, FileText, Plus } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export default function SalesDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/sales/stats');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold">
                ${stats?.todaysSalesTotal?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-gray-500">
                {stats?.todaysSalesCount || 0} invoices
              </p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credit Limit Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.creditLimitAlerts || 0}
              </p>
            </div>
            <Users className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Invoices</p>
              <p className="text-2xl font-bold">{stats?.recentInvoicesCount || 0}</p>
            </div>
            <FileText className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600">
            <Plus size={20} />
            Create Invoice
          </button>
          <button className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
            Check Client Balance
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      {stats?.recentInvoices && stats.recentInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentInvoices.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4">{invoice.client?.name}</td>
                    <td className="px-6 py-4">${invoice.grandTotal.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
