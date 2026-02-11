import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  XCircle,
  Warehouse,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Shuffle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { apiClient } from '../../lib/api-client';
import { Card, Spinner } from '../ui';
import { useCurrencySymbol } from '../../hooks/useSettings';
import { formatCurrencyCompact, formatChartValue } from '../../lib/formatCurrency';

interface CategoryValue {
  category: string;
  value: number;
}

interface LowStockProduct {
  productId: string;
  name: string;
  sku: string;
  category: string;
  currentQty: number;
  reorderLevel: number;
}

interface OutOfStockProduct {
  productId: string;
  name: string;
  sku: string;
  category: string;
}

interface StockMovement {
  id: string;
  type: string;
  productName: string;
  productSku: string;
  quantity: number;
  userName: string;
  date: string;
  notes: string | null;
}

interface WarehouseStats {
  totalItemsInStock: number;
  stockValue: number;
  stockByCategory: CategoryValue[];
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  outOfStockCount: number;
  outOfStockProducts: OutOfStockProduct[];
  pendingReceipts: number;
  recentMovements: StockMovement[];
}

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const movementIcons: Record<string, React.ReactNode> = {
  RECEIPT: <ArrowDownCircle size={16} className="text-green-500" />,
  SALE: <ArrowUpCircle size={16} className="text-blue-500" />,
  ADJUSTMENT: <RefreshCw size={16} className="text-orange-500" />,
  TRANSFER: <Shuffle size={16} className="text-purple-500" />,
  SALES_RETURN: <ArrowDownCircle size={16} className="text-amber-500" />,
};

const movementColors: Record<string, string> = {
  RECEIPT: 'text-green-700 bg-green-50',
  SALE: 'text-blue-700 bg-blue-50',
  ADJUSTMENT: 'text-orange-700 bg-orange-50',
  TRANSFER: 'text-purple-700 bg-purple-50',
  SALES_RETURN: 'text-amber-700 bg-amber-50',
};

export default function WarehouseDashboard() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: stats, isLoading, dataUpdatedAt } = useQuery<WarehouseStats>({
    queryKey: ['warehouse-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/warehouse/stats');
      return response.data.data;
    },
    staleTime: 120000,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  if (!stats) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouse Dashboard</h1>
          <p className="text-gray-600">Inventory status, stock movements, and warehouse operations</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock size={14} className="mr-1" />
          Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Products in Stock</div>
            <Package className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalItemsInStock}</div>
          <div className="text-xs text-gray-500 mt-2">Distinct products with qty &gt; 0</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Stock Value</div>
            <Warehouse className="text-emerald-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrencyCompact(stats.stockValue, cs)}</div>
          <div className="text-xs text-gray-500 mt-2">At cost price</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-amber-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Low Stock</div>
            <AlertTriangle className="text-amber-500" size={20} />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <span className="text-2xl font-bold text-amber-600">{stats.lowStockCount}</span>
              <span className="text-xs text-gray-500 ml-1">low</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</span>
              <span className="text-xs text-gray-500 ml-1">out</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Needs attention</div>
        </div>

        <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Pending Receipts</div>
            <Package className="text-indigo-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingReceipts}</div>
          <div className="text-xs text-gray-500 mt-2">POs in transit</div>
        </div>
      </div>

      {/* Stock Value by Category Chart */}
      <Card className="rounded-xl mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Value by Category</h3>
        {stats.stockByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.stockByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={formatChartValue} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={120} />
              <Tooltip formatter={(value) => [`${cs} ${Number(value).toLocaleString()}`, 'Value']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {stats.stockByCategory.map((_entry, idx) => (
                  <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No inventory data
          </div>
        )}
      </Card>

      {/* Two Column: Recent Movements + Low Stock Alerts */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Movements */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Stock Movements</h3>
          {stats.recentMovements.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats.recentMovements.map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="mt-0.5">{movementIcons[m.type] || <RefreshCw size={16} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${movementColors[m.type] || 'text-gray-600 bg-gray-100'}`}>
                        {m.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">{m.productName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {m.quantity > 0 ? '+' : ''}{m.quantity} units &middot; by {m.userName}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No recent movements
            </div>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card className="rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Low Stock Alerts
            {stats.lowStockCount > 0 && (
              <span className="ml-2 text-sm font-normal text-amber-600">({stats.lowStockCount})</span>
            )}
          </h3>
          {stats.lowStockProducts.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {stats.lowStockProducts.map(p => {
                const pct = Math.round((p.currentQty / p.reorderLevel) * 100);
                return (
                  <div key={p.productId} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.sku} &middot; {p.category}</div>
                      </div>
                      <div className="text-right ml-3">
                        <span className="text-sm font-bold text-amber-700">{p.currentQty}</span>
                        <span className="text-xs text-gray-500"> / {p.reorderLevel}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-green-500">
              All products above reorder level
            </div>
          )}

          {/* Out of Stock section */}
          {stats.outOfStockProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                <XCircle size={14} />
                Out of Stock ({stats.outOfStockCount})
              </h4>
              <div className="space-y-1">
                {stats.outOfStockProducts.map(p => (
                  <div key={p.productId} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                    <div className="min-w-0">
                      <div className="text-sm text-red-800 truncate">{p.name}</div>
                      <div className="text-xs text-red-500">{p.sku}</div>
                    </div>
                    <span className="text-xs font-bold text-red-600 ml-2">0 qty</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Package size={16} />
            View Inventory
          </Link>
          <Link
            to="/inventory/adjustments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
          >
            <RefreshCw size={16} />
            Stock Adjustment
          </Link>
          <Link
            to="/purchase-orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            <Warehouse size={16} />
            Purchase Orders
          </Link>
        </div>
      </Card>
    </div>
  );
}
