import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Users, DollarSign, Calendar, TrendingUp, Phone } from 'lucide-react';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recovery Dashboard</h1>
        <p className="text-gray-600">Collection schedule, overdue accounts, and payment tracking</p>
      </div>

      {/* Top Metrics - 4 Cards with colored left borders */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Outstanding</div>
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-red-600">
            PKR {stats?.totalOutstanding?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-2">From all clients</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Overdue Clients</div>
            <Users className="text-orange-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats?.overdueClients || 0}</div>
          <div className="text-xs text-gray-500 mt-2">Require immediate action</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Collected This Week</div>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-green-600">
            PKR {stats?.collectedThisWeek?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-2">Weekly target progress</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Today's Schedule</div>
            <Calendar className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-xs text-gray-500 mt-2">Clients to visit</div>
        </div>
      </div>

      {/* Quick Actions & Weekly Target */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition border border-blue-200">
              <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Record Payment</div>
              <div className="text-xs text-gray-600">Log collection</div>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition border border-green-200">
              <Calendar className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">View Schedule</div>
              <div className="text-xs text-gray-600">Today's visits</div>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition border border-purple-200">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Client List</div>
              <div className="text-xs text-gray-600">View balances</div>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition border border-orange-200">
              <Phone className="w-8 h-8 text-orange-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Follow-up Calls</div>
              <div className="text-xs text-gray-600">Reminders</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Target</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">PKR 0.0K / PKR 4.0M</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                  style={{ width: '0%' }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">0% achieved</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xs text-gray-600">Critical</div>
                <div className="text-lg font-bold text-red-600">0</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xs text-gray-600">Today</div>
                <div className="text-lg font-bold text-orange-600">0</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-600">This Week</div>
                <div className="text-lg font-bold text-blue-600">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Clients List */}
      {stats?.overdueClientsList && stats.overdueClientsList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-900">Overdue Clients</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Outstanding Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.overdueClientsList.map((client: any) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-red-600">
                        PKR {client.outstandingAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{client.daysOverdue} days</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.phone}</td>
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
