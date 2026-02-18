import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { Breadcrumbs } from '../../../components/ui';

export default function ExpiryAlertsPage() {
  const [days, setDays] = useState(30);
  const [warehouseId, setWarehouseId] = useState('');

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-dropdown'],
    queryFn: async () => (await apiClient.get('/warehouses?limit=100')).data,
  });
  const warehouses = warehousesData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['expiry-alerts', days, warehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('days', String(days));
      if (warehouseId) params.set('warehouseId', warehouseId);
      return (await apiClient.get(`/inventory/expiry-alerts?${params.toString()}`)).data;
    },
  });

  const items = data?.data || [];

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();
  const daysUntilExpiry = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Expiry Alerts' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expiry Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor inventory items approaching or past expiry date</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Ahead</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm">
              <span className="font-medium text-orange-800">{items.length}</span>
              <span className="text-orange-600"> items found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No items expiring within {days} days
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item: any) => {
                const expired = isExpired(item.expiryDate);
                const daysLeft = daysUntilExpiry(item.expiryDate);
                return (
                  <tr key={item.id} className={expired ? 'bg-red-50' : daysLeft <= 7 ? 'bg-orange-50' : ''}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.product?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.product?.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.warehouse?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.batchNo || '-'}</td>
                    <td className="px-6 py-4 text-sm text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {expired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Expired
                        </span>
                      ) : daysLeft <= 7 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {daysLeft}d left
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {daysLeft}d left
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
