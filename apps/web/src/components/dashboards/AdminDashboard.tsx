import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Database, Activity, Shield } from 'lucide-react';
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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'warehouse'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Warehouse View
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sales'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sales View
          </button>
          <button
            onClick={() => setActiveTab('accountant')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accountant'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Accountant View
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recovery'
                ? 'border-primary text-primary'
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">DB Connection</p>
                  <p className="text-lg font-semibold text-green-600">
                    {stats?.dbConnected ? 'Healthy' : 'Error'}
                  </p>
                </div>
                <Database className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Audit Logs</p>
                  <p className="text-2xl font-bold">{stats?.auditLogCount || 0}</p>
                </div>
                <Activity className="text-purple-500" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Status</p>
                  <p className="text-lg font-semibold text-green-600">Operational</p>
                </div>
                <Shield className="text-green-500" size={32} />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/users" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                User Management
              </a>
              <a href="/products" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                Products
              </a>
              <a href="/invoices" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                Invoices
              </a>
              <a href="/reports" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                Reports
              </a>
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
