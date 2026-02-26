import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumbs, Spinner } from '../../../components/ui';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import { apiClient as api } from '../../../lib/api-client';

function usePurchaseInvoiceAging() {
  return useQuery({
    queryKey: ['report-purchase-invoice-aging'],
    queryFn: async () => {
      const { data } = await api.get('/reports/purchase-invoice-aging');
      return data;
    },
  });
}

export const PurchaseInvoiceAgingPage: React.FC = () => {
  const { data: result, isLoading } = usePurchaseInvoiceAging();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Reports', href: '/reports' },
          { label: 'Purchase Invoice Aging' },
        ]}
        className="mb-4"
      />

      <h1 className="text-2xl font-bold text-gray-900">Purchase Invoice Aging Report</h1>
      <p className="text-sm text-gray-500">
        Outstanding purchase invoices grouped by supplier with aging buckets
      </p>

      {/* Summary Cards */}
      {result?.totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrencyDecimal(result.totals.totalOutstanding, cs)}
            </p>
            <p className="text-xs text-gray-400">{result.totals.totalInvoices} invoices</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Current (0-30 days)</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrencyDecimal(result.totals.current, cs)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">31-60 days</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrencyDecimal(result.totals.days31_60, cs)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">61-90+ days</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrencyDecimal(result.totals.days61_90 + result.totals.days90Plus, cs)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-3 text-right font-semibold">Invoices</th>
                  <th className="px-4 py-3 text-right font-semibold text-green-700">Current<br />(0-30)</th>
                  <th className="px-4 py-3 text-right font-semibold text-yellow-700">31-60</th>
                  <th className="px-4 py-3 text-right font-semibold text-orange-700">61-90</th>
                  <th className="px-4 py-3 text-right font-semibold text-red-700">90+</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result?.data?.map((row: any) => (
                  <tr key={row.supplierId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.supplierName}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.invoiceCount}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {row.current > 0 ? formatCurrencyDecimal(row.current, cs) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-700">
                      {row.days31_60 > 0 ? formatCurrencyDecimal(row.days31_60, cs) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-700">
                      {row.days61_90 > 0 ? formatCurrencyDecimal(row.days61_90, cs) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700">
                      {row.days90Plus > 0 ? formatCurrencyDecimal(row.days90Plus, cs) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrencyDecimal(row.totalOutstanding, cs)}
                    </td>
                  </tr>
                ))}
                {result?.data?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No outstanding purchase invoices
                    </td>
                  </tr>
                )}
              </tbody>
              {result?.totals && result.data?.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 font-bold">
                    <td className="px-4 py-3">{result.totals.supplierCount} Suppliers</td>
                    <td className="px-4 py-3 text-right">{result.totals.totalInvoices}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {formatCurrencyDecimal(result.totals.current, cs)}
                    </td>
                    <td className="px-4 py-3 text-right text-yellow-700">
                      {formatCurrencyDecimal(result.totals.days31_60, cs)}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-700">
                      {formatCurrencyDecimal(result.totals.days61_90, cs)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-700">
                      {formatCurrencyDecimal(result.totals.days90Plus, cs)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrencyDecimal(result.totals.totalOutstanding, cs)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
