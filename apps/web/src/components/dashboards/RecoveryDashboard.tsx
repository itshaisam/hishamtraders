import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Users, DollarSign } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export default function RecoveryDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['recovery-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/recovery/stats');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Recovery Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                ${stats?.totalOutstanding?.toFixed(2) || '0.00'}
              </p>
            </div>
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Clients</p>
              <p className="text-2xl font-bold">{stats?.overdueClients || 0}</p>
            </div>
            <Users className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collected This Week</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats?.collectedThisWeek?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Record Client Payment
          </button>
        </div>
      </div>

      {/* Overdue Clients List */}
      {stats?.overdueClientsList && stats.overdueClientsList.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Overdue Clients</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Outstanding Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.overdueClientsList.map((client: any) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4">{client.name}</td>
                    <td className="px-6 py-4 text-red-600 font-semibold">
                      ${client.outstandingAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">{client.daysOverdue} days</td>
                    <td className="px-6 py-4">{client.phone}</td>
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
