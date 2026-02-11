import React from 'react';
import { useLandedCost } from '../hooks/usePurchaseOrders';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface LandedCostBreakdownProps {
  poId: string;
}

export const LandedCostBreakdown: React.FC<LandedCostBreakdownProps> = ({ poId }) => {
  const { data, isLoading, error } = useLandedCost(poId);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Landed Cost Breakdown</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Landed Cost Breakdown</h3>
        <div className="text-red-600">Failed to load landed cost calculation</div>
      </div>
    );
  }

  if (!data?.data) {
    return null;
  }

  const landedCost = data.data;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Landed Cost Breakdown</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Total Product Cost</p>
          <p className="text-2xl font-bold text-blue-900">
            {cs} {landedCost.totalProductCost.toLocaleString()}
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium mb-1">Additional Costs</p>
          <p className="text-2xl font-bold text-orange-900">
            {cs} {landedCost.totalAdditionalCosts.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Grand Total (Landed)</p>
          <p className="text-2xl font-bold text-green-900">
            {cs} {landedCost.grandTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Per-Product Breakdown Table */}
      {landedCost.breakdown.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3">Per-Product Allocation</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ratio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Landed
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                    Cost Per Unit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {landedCost.breakdown.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-gray-500 text-xs">{item.productSku}</p>
                        {item.variantName && (
                          <p className="text-blue-600 text-xs mt-1">{item.variantName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {cs} {item.productCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {(item.productRatio * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                      {cs} {item.allocatedAdditionalCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                      {cs} {item.totalLandedCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right bg-yellow-50 font-bold text-gray-900">
                      {cs} {item.landedCostPerUnit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr className="font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {cs} {landedCost.totalProductCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600">
                    {cs} {landedCost.totalAdditionalCosts.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-700">
                    {cs} {landedCost.grandTotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 bg-yellow-50"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Info Note */}
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> Additional costs (shipping, customs, tax) are
              allocated proportionally to each product based on its share of the total product cost. The{' '}
              <span className="font-semibold">Cost Per Unit</span> shown includes both the base product
              cost and its allocated share of additional costs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
