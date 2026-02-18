import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { useAllClientPayments } from '../../../hooks/usePayments';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { PaymentMethod } from '../../../types/payment.types';

interface ClientPaymentHistoryProps {
  clientId: string;
}

export const ClientPaymentHistory: React.FC<ClientPaymentHistoryProps> = ({ clientId }) => {
  const { data, isLoading, error } = useAllClientPayments(clientId);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const payments = data?.data?.slice(0, 5) || [];

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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load payment history. Please try again.
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No payments recorded for this client yet.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment: any) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(payment.date), 'yyyy-MM-dd')}
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
                      {payment.allocations.slice(0, 3).map((allocation: any) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View All Link */}
      <div className="mt-4 text-center">
        <Link
          to="/payments/client/history"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Payments
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
