import React, { useState } from 'react';
import { PurchaseOrder, POCost } from '../types/purchase-order.types';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';
import { AddCostModal } from './AddCostModal';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface POAdditionalCostsTableProps {
  po: PurchaseOrder;
}

const costTypeLabels: Record<string, string> = {
  SHIPPING: 'Shipping',
  CUSTOMS: 'Customs',
  TAX: 'Tax',
  OTHER: 'Other',
};

export const POAdditionalCostsTable: React.FC<POAdditionalCostsTableProps> = ({ po }) => {
  const user = useAuthStore((state: any) => state.user);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  // Only ADMIN and ACCOUNTANT can add costs
  const canAddCost = user?.role?.name === 'ADMIN' || user?.role?.name === 'ACCOUNTANT';

  // Only show section when PO is IN_TRANSIT or RECEIVED
  if (po.status !== 'IN_TRANSIT' && po.status !== 'RECEIVED') {
    return null;
  }

  const costs = po.costs || [];
  const totalAdditionalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Additional Costs</h3>
        {canAddCost && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Add Cost
          </button>
        )}
      </div>

      {costs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No additional costs added yet
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costs.map((cost) => (
                  <tr key={cost.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {costTypeLabels[cost.type] || cost.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cs} {Number(cost.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {cost.description || <span className="text-gray-400 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(cost.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Row */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Additional Costs</p>
                <p className="text-xl font-bold text-gray-900">
                  {cs} {totalAdditionalCosts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Cost Modal */}
      {isAddModalOpen && (
        <AddCostModal
          poId={po.id}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};
