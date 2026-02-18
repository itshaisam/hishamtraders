import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { DollarSign, ArrowLeft, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useCreateClientPayment, useClientOutstandingInvoices } from '../../../hooks/usePayments';
import { useClients } from '../../../hooks/useClients';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { useBankAccounts } from '../../../hooks/useBankAccounts';
import { PaymentMethod } from '../../../types/payment.types';

interface PaymentFormData {
  clientId: string;
  amount: string;
  method: PaymentMethod;
  referenceNumber: string;
  date: string;
  notes: string;
  bankAccountId: string;
}

function RecordClientPaymentPage() {
  const navigate = useNavigate();
  const { clientId: urlClientId } = useParams();
  const [showAllocation, setShowAllocation] = useState(false);
  const [allocationResult, setAllocationResult] = useState<any>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      clientId: urlClientId || '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const createPayment = useCreateClientPayment();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: clientsData, isLoading: clientsLoading } = useClients({ page: 1, limit: 1000 });
  const { data: bankAccounts } = useBankAccounts();

  const selectedClientId = watch('clientId');
  const selectedMethod = watch('method');

  const { data: outstandingInvoicesData, isLoading: invoicesLoading } = useClientOutstandingInvoices(
    selectedClientId || ''
  );
  const outstandingInvoices = outstandingInvoicesData?.data || [];

  // Calculate total outstanding for selected client
  const totalOutstanding = outstandingInvoices.reduce((sum: number, invoice: any) => {
    const invoiceTotal = parseFloat(invoice.total);
    const paidAmount = parseFloat(invoice.paidAmount);
    return sum + (invoiceTotal - paidAmount);
  }, 0);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const result = await createPayment.mutateAsync({
        clientId: data.clientId,
        amount: parseFloat(data.amount),
        method: data.method,
        referenceNumber: data.referenceNumber || undefined,
        date: data.date,
        notes: data.notes,
        bankAccountId: data.bankAccountId || undefined,
      });

      // Show allocation result
      setAllocationResult(result.data.allocation);
      setShowAllocation(true);
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  const handleFinish = () => {
    if (urlClientId) {
      navigate(`/clients/${urlClientId}`);
    } else {
      navigate('/clients');
    }
  };

  if (showAllocation && allocationResult) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">Payment Recorded Successfully</h1>
              <p className="text-gray-600 mt-2">Payment has been allocated to invoices using FIFO</p>
            </div>

            {/* Allocation Summary */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-900 mb-3">Allocation Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-600">Total Allocated</p>
                  <p className="font-semibold text-green-900 text-lg">
                    {cs} {allocationResult.totalAllocated.toFixed(2)}
                  </p>
                </div>
                {allocationResult.overpayment > 0 && (
                  <div>
                    <p className="text-orange-600">Overpayment (Credit Balance)</p>
                    <p className="font-semibold text-orange-900 text-lg">
                      {cs} {allocationResult.overpayment.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Allocations */}
            {allocationResult.allocations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Payment Allocated to {allocationResult.allocations.length} Invoice(s)
                </h3>
                <div className="space-y-2">
                  {allocationResult.allocations.map((allocation: any, index: number) => (
                    <div
                      key={allocation.invoiceId}
                      className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{allocation.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">Invoice #{index + 1}</p>
                      </div>
                      <p className="font-semibold text-green-700">
                        {cs} {allocation.allocatedAmount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allocationResult.allocations.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900">No Outstanding Invoices</p>
                  <p className="text-yellow-700 mt-1">
                    This payment was recorded but not allocated to any invoices. The full amount is
                    credited to the customer's account.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleFinish}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Record Customer Payment
          </h1>
          <p className="text-gray-600 mt-1">Record a payment received from a customer</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              {...register('clientId', { required: 'Customer is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={clientsLoading || !!urlClientId}
            >
              <option value="">Select Customer</option>
              {clientsData?.data?.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          {/* Outstanding Invoices Info */}
          {selectedClientId && outstandingInvoices.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Outstanding Invoices ({outstandingInvoices.length})
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Total Outstanding: <span className="font-bold">{cs} {totalOutstanding.toFixed(2)}</span>
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {outstandingInvoices.slice(0, 5).map((invoice: any) => {
                      const invoiceTotal = parseFloat(invoice.total);
                      const paidAmount = parseFloat(invoice.paidAmount);
                      const outstanding = invoiceTotal - paidAmount;
                      return (
                        <div
                          key={invoice.id}
                          className="flex justify-between items-center text-xs bg-white p-2 rounded"
                        >
                          <span className="text-blue-900 font-medium">{invoice.invoiceNumber}</span>
                          <span className="text-blue-700">{cs} {outstanding.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {outstandingInvoices.length > 5 && (
                      <p className="text-xs text-blue-600 italic">
                        +{outstandingInvoices.length - 5} more invoice(s)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-2 italic">
                    Payment will be allocated to invoices using FIFO (oldest first)
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedClientId && outstandingInvoices.length === 0 && !invoicesLoading && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">No Outstanding Invoices</p>
                <p className="text-yellow-700 mt-1">
                  This customer has no outstanding invoices. The payment will be credited to their
                  account.
                </p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              {...register('method', { required: 'Payment method is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Method</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
              <option value={PaymentMethod.CHEQUE}>Cheque</option>
            </select>
            {errors.method && (
              <p className="mt-1 text-sm text-red-600">{errors.method.message}</p>
            )}
          </div>

          {/* Reference Number (required for cheque/bank transfer) */}
          {(selectedMethod === PaymentMethod.CHEQUE ||
            selectedMethod === PaymentMethod.BANK_TRANSFER) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('referenceNumber', {
                  required:
                    selectedMethod === PaymentMethod.CHEQUE ||
                    selectedMethod === PaymentMethod.BANK_TRANSFER
                      ? 'Reference number is required for cheque or bank transfer'
                      : false,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  selectedMethod === PaymentMethod.CHEQUE
                    ? 'Enter cheque number'
                    : 'Enter transaction reference'
                }
              />
              {errors.referenceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.referenceNumber.message}</p>
              )}
            </div>
          )}

          {/* Bank Account */}
          {selectedMethod && selectedMethod !== PaymentMethod.CASH && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account
              </label>
              <select
                {...register('bankAccountId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Default (Main Bank Account)</option>
                {bankAccounts?.filter((a) => a.code !== '1102').map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.code} - {bank.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Select which bank account to credit</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('date', { required: 'Payment date is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={createPayment.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {createPayment.isPending ? 'Recording...' : 'Record Payment'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordClientPaymentPage;
