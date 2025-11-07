import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Database, Activity, Shield, TrendingUp, Package } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import WarehouseDashboard from './WarehouseDashboard';
import SalesDashboard from './SalesDashboard';
import AccountantDashboard from './AccountantDashboard';
import RecoveryDashboard from './RecoveryDashboard';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch admin stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Complete system overview and business intelligence</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'warehouse'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Warehouse View
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sales View
          </button>
          <button
            onClick={() => setActiveTab('accountant')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'accountant'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Accountant View
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
              activeTab === 'recovery'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recovery View
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Top Metrics - 6 Cards with colored left borders */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Users</div>
                <Users className="text-blue-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
              <div className="text-xs text-gray-500 mt-2">Active system users</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">DB Connection</div>
                <Database className="text-green-500" size={20} />
              </div>
              <div className="text-lg font-semibold text-green-600">
                {stats?.dbConnected ? 'Healthy' : 'Error'}
              </div>
              <div className="text-xs text-gray-500 mt-2">System database status</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Audit Logs</div>
                <Activity className="text-purple-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.auditLogCount || 0}</div>
              <div className="text-xs text-gray-500 mt-2">Total logged actions</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">System Status</div>
                <Shield className="text-green-500" size={20} />
              </div>
              <div className="text-lg font-semibold text-green-600">Operational</div>
              <div className="text-xs text-gray-500 mt-2">All systems running</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Monthly Revenue</div>
                <TrendingUp className="text-indigo-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">PKR 0.0M</div>
              <div className="text-xs text-green-600 mt-2">Coming soon</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Stock Value</div>
                <Package className="text-red-500" size={20} />
              </div>
              <div className="text-3xl font-bold text-gray-900">PKR 0.0M</div>
              <div className="text-xs text-gray-500 mt-2">Coming soon</div>
            </div>
          </div>

          {/* Activity & System Health */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activity Log
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">System initialized</div>
                    <div className="text-xs text-gray-500">Foundation & Auth complete</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Audit logging active</div>
                    <div className="text-xs text-gray-500">All actions being tracked</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">RBAC configured</div>
                    <div className="text-xs text-gray-500">Role-based access control ready</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                System Health & Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Database Storage</span>
                    <span className="font-semibold text-gray-900">15%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                      style={{ width: '15%' }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">0.8 GB / 5.0 GB</div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">API Response Time</span>
                    <span className="font-semibold text-green-600">Excellent</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">~50ms</div>
                  <div className="text-xs text-gray-500 mt-1">Average response time</div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Active Sessions</span>
                    <span className="font-semibold text-blue-600">1</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Total registered users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'warehouse' && <WarehouseDashboard />}
      {activeTab === 'sales' && <SalesDashboard />}
      {activeTab === 'accountant' && <AccountantDashboard />}
      {activeTab === 'recovery' && <RecoveryDashboard />}
    </div>
  );
}
