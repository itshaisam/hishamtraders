import { X } from 'lucide-react';
import { usePaymentDetails } from '../../../hooks/usePayments';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../../../types/payment.types';
import { format } from 'date-fns';

interface PaymentDetailsModalProps {
  paymentId: string;
  onClose: () => void;
}

export default function PaymentDetailsModal({ paymentId, onClose }: PaymentDetailsModalProps) {
  const { data, isLoading, error } = usePaymentDetails(paymentId);
  const payment = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
              Failed to load payment details
            </div>
          )}

          {payment && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Type</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    payment.paymentType === 'CLIENT'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {PAYMENT_TYPE_LABELS[payment.paymentType]} ({payment.paymentType === 'CLIENT' ? 'IN' : 'OUT'})
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {format(new Date(payment.date), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Amount</p>
                  <p className={`mt-1 text-lg font-bold ${
                    payment.paymentType === 'CLIENT' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Rs {parseFloat(payment.amount.toString()).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </p>
                </div>
              </div>

              {/* Party Info */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  {payment.paymentType === 'CLIENT' ? 'Client' : 'Supplier'}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {payment.client?.name || payment.supplier?.name || 'N/A'}
                </p>
                {payment.client?.balance !== undefined && payment.client?.balance !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current Balance: Rs {parseFloat(payment.client.balance.toString()).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Reference & Notes */}
              {(payment.referenceNumber || payment.notes) && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {payment.referenceNumber && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Reference Number</p>
                      <p className="text-sm text-gray-900">{payment.referenceNumber}</p>
                    </div>
                  )}
                  {payment.notes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Notes</p>
                      <p className="text-sm text-gray-900">{payment.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recorded By */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 uppercase">Recorded By</p>
                <p className="text-sm text-gray-900">{payment.user.name} ({payment.user.email})</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(payment.createdAt), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>

              {/* Client Payment Allocations */}
              {payment.paymentType === 'CLIENT' && payment.allocations.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Invoice Allocations</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Invoice Total</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Allocated</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payment.allocations.map((alloc) => (
                          <tr key={alloc.id}>
                            <td className="px-3 py-2 font-medium text-blue-600">
                              {alloc.invoice.invoiceNumber}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              Rs {parseFloat(alloc.invoice.total.toString()).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-green-700">
                              Rs {parseFloat(alloc.amount.toString()).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                alloc.invoice.status === 'PAID'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {alloc.invoice.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Supplier Payment - PO Reference */}
              {payment.paymentType === 'SUPPLIER' && payment.purchaseOrder && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Linked Purchase Order</p>
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.purchaseOrder.poNumber}</p>
                        <p className="text-xs text-gray-500">
                          Total: Rs {parseFloat(payment.purchaseOrder.totalAmount.toString()).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        payment.purchaseOrder.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {payment.purchaseOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
