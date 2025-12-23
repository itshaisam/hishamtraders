import React from 'react';
import { Info, Package, TrendingUp } from 'lucide-react';

export function InventoryInfoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How Inventory Works
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Package size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                <strong>Inventory is created automatically</strong> when you receive goods from Purchase Orders
              </p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                <strong>Stock levels update in real-time</strong> as you receive shipments, make sales, or adjust inventory
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-700">
            To add inventory: Go to <strong>Purchase Orders → Receive Goods</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
