import React from 'react';
import { Eye, Edit2, Trash2, FileText } from 'lucide-react';
import { PurchaseOrder } from '../types/purchase-order.types';
import { POStatusBadge } from './POStatusBadge';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface POListProps {
  pos: PurchaseOrder[];
  isLoading: boolean;
  onView: (po: PurchaseOrder) => void;
  onEdit: (po: PurchaseOrder) => void;
  onDelete: (po: PurchaseOrder) => void;
  canEdit: boolean;
}

export const POList: React.FC<POListProps> = ({
  pos,
  isLoading,
  onView,
  onEdit,
  onDelete,
  canEdit,
}) => {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading purchase orders...</p>
      </div>
    );
  }

  if (pos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 text-lg">No purchase orders found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">
              PO Number
            </th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">
              Supplier
            </th>
            <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold text-gray-900">
              Order Date
            </th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-right font-semibold text-gray-900">
              Total
            </th>
            <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-900">
              Status
            </th>
            <th className="px-3 sm:px-6 py-2 sm:py-3 text-center font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {pos.map((po) => (
            <tr key={po.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-3 sm:px-6 py-2 sm:py-3">
                <span className="font-mono font-semibold text-blue-600 text-xs sm:text-sm">
                  {po.poNumber}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-3">
                <div>
                  <p className="font-medium text-gray-900 text-xs sm:text-sm">
                    {po.supplier?.name || '-'}
                  </p>
                  {po.supplier?.contactPerson && (
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {po.supplier.contactPerson}
                    </p>
                  )}
                </div>
              </td>
              <td className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3">
                <span className="text-gray-600 text-xs sm:text-sm">
                  {new Date(po.orderDate).toLocaleDateString()}
                </span>
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-3 text-right">
                <span className="font-medium text-gray-900 text-xs sm:text-sm">
                  {cs} {po.totalAmount.toFixed(2)}
                </span>
              </td>
              <td className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-center">
                <POStatusBadge status={po.status} />
              </td>
              <td className="px-3 sm:px-6 py-2 sm:py-3 text-center">
                <div className="flex gap-1 sm:gap-2 justify-center">
                  <button
                    onClick={() => onView(po)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                  {canEdit && po.status === 'PENDING' && (
                    <button
                      onClick={() => onEdit(po)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {canEdit && po.status === 'PENDING' && (
                    <button
                      onClick={() => onDelete(po)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
