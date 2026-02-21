import React from 'react';
import { GoodsReceiveNoteItem } from '../types/goods-receipt.types';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface GRNItemsTableProps {
  items: GoodsReceiveNoteItem[];
}

export const GRNItemsTable: React.FC<GRNItemsTableProps> = ({ items }) => {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-center py-6">No items</p>;
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * (item.poItem?.unitCost || 0),
    0
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">SKU</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900">Qty Received</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900">Unit Cost</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900">Amount</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Bin Location</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Batch No</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const unitCost = item.poItem?.unitCost || 0;
            const amount = item.quantity * unitCost;

            return (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="px-4 py-3 text-gray-900">
                  <div>
                    <p className="font-medium">{item.product?.name || 'Unknown'}</p>
                    {item.productVariant && (
                      <p className="text-xs text-gray-500">{item.productVariant.variantName}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                  {item.productVariant?.sku || item.product?.sku || '-'}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {cs} {unitCost.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 font-medium">
                  {cs} {amount.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-gray-700">{item.binLocation || '-'}</td>
                <td className="px-4 py-3 text-gray-700 font-mono text-xs">{item.batchNo || '-'}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50">
            <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
              Total:
            </td>
            <td className="px-4 py-3 text-right font-semibold text-blue-600">
              {cs} {totalAmount.toFixed(4)}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
