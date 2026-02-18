import React from 'react';
import { Trash2, Package } from 'lucide-react';
import { POItem } from '../types/purchase-order.types';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface POItemsTableProps {
  items: POItem[];
  onRemoveItem?: (index: number) => void;
  readonly?: boolean;
}

export const POItemsTable: React.FC<POItemsTableProps> = ({
  items,
  onRemoveItem,
  readonly = false,
}) => {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  if (items.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <Package size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">No items added yet</p>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-900">
              SKU
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">
              Product Name
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-900">
              Quantity
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900">
              Unit Cost
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900">
              Total Cost
            </th>
            {!readonly && (
              <th className="px-4 py-3 text-center font-semibold text-gray-900">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id || index} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className="font-mono font-semibold text-blue-600">
                  {item.product?.sku || '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-gray-900">
                  {item.product?.name || '-'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-gray-900">{item.quantity}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-gray-900">
                  {cs} {item.unitCost.toFixed(4)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-gray-900">
                  {cs} {item.totalCost.toFixed(4)}
                </span>
              </td>
              {!readonly && (
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onRemoveItem?.(index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          <tr className="bg-blue-50 border-t-2 border-blue-200">
            <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
              Total Amount:
            </td>
            <td className="px-4 py-3 text-right">
              <span className="text-lg font-bold text-blue-600">
                {cs} {totalAmount.toFixed(4)}
              </span>
            </td>
            {!readonly && <td className="px-4 py-3"></td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
