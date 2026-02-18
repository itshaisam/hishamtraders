import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DollarSign, Plus, Eye } from 'lucide-react';
import { useAllClientPayments } from '../../../hooks/usePayments';
import { useClients } from '../../../hooks/useClients';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { PaymentMethod } from '../../../types/payment.types';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { ListPageSkeleton } from '../../../components/ui';

function ClientPaymentsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const { data: clientsData, isLoading: clientsLoading } = useClients({ page: 1, limit: 1000 });
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data, isLoading, error } = useAllClientPayments(selectedClientId || undefined);

  const payments = data?.data || [];

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
      <Breadcrumbs items={[{ label: 'Payments', href: '/payments/supplier' }, { label: 'Customer Payments' }]} className="mb-4" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Customer Payments
          </h1>
          <p className="text-gray-600 mt-1">View customer payment history and allocations</p>
        </div>
        <Link
          to="/payments/client/record"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={clientsLoading}
            >
              <option value="">All Customers</option>
              {clientsData?.data?.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
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
            {selectedClientId
              ? 'No payments found for this customer.'
              : 'No customer payments recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
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
                    Invoices Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                      {payment.client?.name || '-'}
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
                      {payment.referenceNumber || payment.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.allocations && payment.allocations.length > 0 ? (
                        <div className="space-y-1">
                          {payment.allocations.map((allocation: any, index: number) => (
                            <div key={allocation.id} className="flex items-center gap-2">
                              <span className="text-blue-600 font-medium">
                                {allocation.invoice.invoiceNumber}
                              </span>
                              <span className="text-gray-500 text-xs">
                                ({cs} {parseFloat(allocation.amount).toFixed(4)})
                              </span>
                            </div>
                          ))}
                          {payment.allocations.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              +{payment.allocations.length - 3} more...
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No allocation</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {payment.user.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {payment.client && (
                        <Link
                          to={`/clients/${payment.client.id}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Customer
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientPaymentsPage;
