import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DollarSign, Plus, X } from 'lucide-react';
import { useSupplierPayments } from '../../../hooks/usePayments';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { PaymentFilters, PaymentMethod } from '../../../types/payment.types';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { ListPageSkeleton } from '../../../components/ui';

function SupplierPaymentsPage() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 50,
  });

  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ page: 1, limit: 1000 });
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data, isLoading, error } = useSupplierPayments(filters);

  const payments = data?.data || [];
  const pagination = data?.pagination;

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH:
        return 'bg-green-100 text-green-800';
      case PaymentMethod.BANK_TRANSFER:
        return 'bg-blue-100 text-blue-800';
      case PaymentMethod.CHEQUE:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Payments', href: '/payments/supplier' }, { label: 'Supplier Payments' }]} className="mb-4" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Supplier Payments
          </h1>
          <p className="text-gray-600 mt-1">View and manage supplier payment history</p>
        </div>
        <Link
          to="/payments/supplier/record"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              value={filters.supplierId || ''}
              onChange={(e) => setFilters({ ...filters, supplierId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={suppliersLoading}
            >
              <option value="">All Suppliers</option>
              {suppliersData?.data?.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.method || ''}
              onChange={(e) =>
                setFilters({ ...filters, method: e.target.value as PaymentMethod, page: 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
              <option value={PaymentMethod.CHEQUE}>Cheque</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <ListPageSkeleton />
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error loading payments. Please try again.
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No payments found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO / Reference
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference / Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(payment.date), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.supplier?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.referenceId ? (
                          <span className="text-blue-600">
                            {payment.paymentReferenceType}: {payment.referenceId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">General Payment</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-700">
                        {cs} {parseFloat(payment.amount).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMethodBadge(
                            payment.method
                          )}`}
                        >
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {payment.user.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span> (
                    <span className="font-medium">{pagination.total}</span> total records)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                      disabled={(filters.page || 1) === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                      disabled={(filters.page || 1) >= pagination.totalPages}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SupplierPaymentsPage;
