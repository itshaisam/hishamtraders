import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, XCircle, Plus, Warehouse, TrendingUp } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

export default function WarehouseDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['warehouse-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/warehouse/stats');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouse Dashboard</h1>
        <p className="text-gray-600">Inventory status, stock movements, and warehouse operations</p>
      </div>

      {/* Top Metrics - 4 Cards with colored left borders */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Pending Receipts</div>
            <Package className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.pendingReceipts || 0}</div>
          <div className="text-xs text-gray-500 mt-2">POs to receive</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Low Stock Alerts</div>
            <AlertTriangle className="text-orange-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-600">{stats?.lowStockCount || 0}</div>
          <div className="text-xs text-gray-500 mt-2">Reorder required</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Out of Stock</div>
            <XCircle className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-red-600">{stats?.outOfStockCount || 0}</div>
          <div className="text-xs text-gray-500 mt-2">Urgent attention</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Stock Value</div>
            <Warehouse className="text-purple-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">PKR 0.0M</div>
          <div className="text-xs text-gray-500 mt-2">Coming soon</div>
        </div>
      </div>

      {/* Quick Actions & Stock Status */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition border border-blue-200">
              <Package className="w-8 h-8 text-blue-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Record Receipt</div>
              <div className="text-xs text-gray-600">Receive goods</div>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition border border-purple-200">
              <Warehouse className="w-8 h-8 text-purple-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Issue Gate Pass</div>
              <div className="text-xs text-gray-600">Dispatch items</div>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition border border-green-200">
              <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">Stock Transfer</div>
              <div className="text-xs text-gray-600">Move inventory</div>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition border border-orange-200">
              <AlertTriangle className="w-8 h-8 text-orange-600 mb-2" />
              <div className="text-sm font-semibold text-gray-900">View Alerts</div>
              <div className="text-xs text-gray-600">Stock warnings</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-purple-600" />
            Stock Status by Warehouse
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div>
                <div className="text-sm font-medium text-gray-900">Main Warehouse</div>
                <div className="text-xs text-gray-500">Karachi</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">Healthy</div>
                <div className="text-xs text-gray-500">PKR 0.0M</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Warehouse 2</div>
                <div className="text-xs text-gray-500">Lahore</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-600">Coming Soon</div>
                <div className="text-xs text-gray-500">PKR 0.0M</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Products Table */}
      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-gray-900">Low Stock Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Min Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.lowStockProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-orange-600">
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.minLevel}</td>
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
