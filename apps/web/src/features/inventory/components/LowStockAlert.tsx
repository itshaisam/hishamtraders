import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useLowStock } from '@/hooks/useInventory';

/**
 * LowStockAlert - Dashboard widget showing low stock items
 * Displays count and allows navigation to filtered inventory view
 */
export const LowStockAlert: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useLowStock();

  const lowStockItems = data?.data || [];
  const lowStockCount = data?.count || 0;
  const outOfStockCount = lowStockItems.filter((item) => item.status === 'OUT_OF_STOCK').length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
          </div>
          {lowStockCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {lowStockCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">All items are adequately stocked!</p>
            <p className="text-xs text-gray-400 mt-1">No low stock alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700 font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {lowStockCount - outOfStockCount}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700 font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{outOfStockCount}</p>
              </div>
            </div>

            {/* Items List (Top 5) */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Critical Items
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.productVariant?.sku || item.product.sku} • {item.warehouse.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`text-xs font-semibold ${
                          item.status === 'OUT_OF_STOCK' ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      >
                        {item.quantity}
                      </span>
                      <span className="text-xs text-gray-400">/ {item.product.reorderLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockCount > 5 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{lowStockCount - 5} more item{lowStockCount - 5 > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={() => navigate('/stock-levels?status=LOW_STOCK')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              View All Low Stock Items
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
