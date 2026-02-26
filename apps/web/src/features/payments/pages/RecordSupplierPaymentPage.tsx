import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { DollarSign, ArrowLeft, Info } from 'lucide-react';
import { useCreateSupplierPayment, usePOBalance } from '../../../hooks/usePayments';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';
import { usePurchaseOrders } from '../../purchase-orders/hooks/usePurchaseOrders';
import { usePurchaseInvoices } from '../../../hooks/usePurchaseInvoices';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { useBankAccounts } from '../../../hooks/useBankAccounts';
import { useWorkflowSettings } from '../../../hooks/useWorkflowSettings';
import { PaymentMethod, PaymentReferenceType } from '../../../types/payment.types';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

interface PaymentFormData {
  supplierId: string;
  paymentReferenceType: string;
  referenceId: string;
  amount: string;
  method: PaymentMethod;
  date: string;
  notes: string;
  bankAccountId: string;
}

function RecordSupplierPaymentPage() {
  const navigate = useNavigate();
  const { data: wfSettings } = useWorkflowSettings();
  const requirePI = wfSettings?.['purchasing.requirePurchaseInvoice'] ?? false;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      paymentReferenceType: requirePI ? PaymentReferenceType.PURCHASE_INVOICE : PaymentReferenceType.GENERAL,
    },
  });

  const createPayment = useCreateSupplierPayment();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ page: 1, limit: 100 });
  const { data: posData, isLoading: posLoading } = usePurchaseOrders({ page: 1, limit: 100 });
  const { data: pisData } = usePurchaseInvoices({ page: 1, limit: 200 });
  const { data: bankAccounts } = useBankAccounts();

  const selectedSupplierId = watch('supplierId');
  const selectedPOId = watch('referenceId');
  const selectedMethod = watch('method');
  const paymentReferenceType = watch('paymentReferenceType');

  const { data: poBalanceData } = usePOBalance(selectedPOId);
  const poBalance = poBalanceData?.data;

  // When requirePI setting loads and is true, force reference type to PI
  useEffect(() => {
    if (requirePI) {
      setValue('paymentReferenceType', PaymentReferenceType.PURCHASE_INVOICE);
    }
  }, [requirePI, setValue]);

  // Filter POs by selected supplier
  const filteredPOs = selectedSupplierId
    ? posData?.data?.filter((po: any) => po.supplierId === selectedSupplierId)
    : [];

  // Filter Purchase Invoices by selected supplier
  const filteredPIs = selectedSupplierId
    ? pisData?.data?.filter((pi: any) => pi.supplierId === selectedSupplierId)
    : [];

  // Reset PO selection when supplier changes
  useEffect(() => {
    if (selectedSupplierId) {
      setValue('referenceId', '');
    }
  }, [selectedSupplierId, setValue]);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await createPayment.mutateAsync({
        supplierId: data.supplierId,
        paymentReferenceType: data.paymentReferenceType === PaymentReferenceType.GENERAL
          ? undefined
          : (data.paymentReferenceType as PaymentReferenceType),
        referenceId: data.referenceId || undefined,
        amount: parseFloat(data.amount),
        method: data.method,
        date: data.date,
        notes: data.notes,
        bankAccountId: data.bankAccountId || undefined,
      });
      navigate('/payments/supplier/history');
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Payments', href: '/payments/supplier' }, { label: 'Supplier Payments', href: '/payments/supplier/history' }, { label: 'Record Payment' }]} className="mb-4" />
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
            Record Supplier Payment
          </h1>
          <p className="text-gray-600 mt-1">Record a payment made to a supplier</p>
        </div>
      </div>

      {/* Workflow enforcement banner */}
      {requirePI && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Purchase Invoice required</p>
            <p className="mt-1 text-sm text-amber-700">
              Payments must be recorded against a Purchase Invoice. Create a{' '}
              <a href="/purchase-invoices/create" className="underline font-medium">Purchase Invoice</a>{' '}
              first if you haven't already.
            </p>
            <p className="mt-1 text-xs text-amber-600">This setting can be changed in <a href="/settings?tab=workflow" className="underline">System Settings</a>.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Supplier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              {...register('supplierId', { required: 'Supplier is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={suppliersLoading}
            >
              <option value="">Select Supplier</option>
              {suppliersData?.data?.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplierId && (
              <p className="mt-1 text-sm text-red-600">{errors.supplierId.message}</p>
            )}
          </div>

          {/* Payment Reference Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              {...register('paymentReferenceType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={requirePI}
            >
              {!requirePI && <option value={PaymentReferenceType.GENERAL}>General Payment / Advance</option>}
              {!requirePI && <option value={PaymentReferenceType.PO}>Against Purchase Order</option>}
              <option value={PaymentReferenceType.PURCHASE_INVOICE}>Against Purchase Invoice</option>
            </select>
            {requirePI && (
              <p className="mt-1 text-xs text-amber-600">Locked — Purchase Invoice is required by workflow settings</p>
            )}
          </div>

          {/* PO Selection (if payment type is PO) */}
          {paymentReferenceType === PaymentReferenceType.PO && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order <span className="text-red-500">*</span>
              </label>
              <select
                {...register('referenceId', {
                  required: paymentReferenceType === PaymentReferenceType.PO ? 'PO is required' : false,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedSupplierId || posLoading}
              >
                <option value="">Select Purchase Order</option>
                {filteredPOs?.map((po: any) => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} - {cs} {parseFloat(po.totalAmount).toFixed(4)}
                  </option>
                ))}
              </select>
              {errors.referenceId && (
                <p className="mt-1 text-sm text-red-600">{errors.referenceId.message}</p>
              )}
            </div>
          )}

          {/* Purchase Invoice Selection (if payment type is PURCHASE_INVOICE) */}
          {paymentReferenceType === PaymentReferenceType.PURCHASE_INVOICE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Invoice <span className="text-red-500">*</span>
              </label>
              <select
                {...register('referenceId', {
                  required: paymentReferenceType === PaymentReferenceType.PURCHASE_INVOICE ? 'Purchase Invoice is required' : false,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedSupplierId}
              >
                <option value="">Select Purchase Invoice</option>
                {filteredPIs?.map((pi: any) => (
                  <option key={pi.id} value={pi.id}>
                    {pi.invoiceNumber || pi.internalNumber} - {cs} {parseFloat(pi.total).toFixed(4)}
                    {pi.status === 'PAID' ? ' (Paid)' : pi.status === 'PARTIAL' ? ' (Partial)' : ''}
                  </option>
                ))}
              </select>
              {errors.referenceId && (
                <p className="mt-1 text-sm text-red-600">{errors.referenceId.message}</p>
              )}
            </div>
          )}

          {/* PO Balance Info */}
          {selectedPOId && poBalance && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Purchase Order Balance</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">Total Amount</p>
                  <p className="font-semibold text-blue-900">{cs} {poBalance.total.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-blue-600">Paid</p>
                  <p className="font-semibold text-green-700">{cs} {poBalance.paid.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-blue-600">Outstanding</p>
                  <p className="font-semibold text-red-700">{cs} {poBalance.outstanding.toFixed(4)}</p>
                </div>
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
              step="0.0001"
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
              <p className="mt-1 text-xs text-gray-500">Select which bank account to debit</p>
            </div>
          )}

          {/* Reference/Notes (required for cheque/bank transfer) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedMethod === PaymentMethod.CHEQUE || selectedMethod === PaymentMethod.BANK_TRANSFER
                ? 'Reference Number'
                : 'Notes'}{' '}
              {(selectedMethod === PaymentMethod.CHEQUE || selectedMethod === PaymentMethod.BANK_TRANSFER) && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <textarea
              {...register('notes', {
                required:
                  selectedMethod === PaymentMethod.CHEQUE || selectedMethod === PaymentMethod.BANK_TRANSFER
                    ? 'Reference number is required for cheque or bank transfer'
                    : false,
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                selectedMethod === PaymentMethod.CHEQUE
                  ? 'Enter cheque number'
                  : selectedMethod === PaymentMethod.BANK_TRANSFER
                  ? 'Enter transaction reference'
                  : 'Additional notes...'
              }
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
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

export default RecordSupplierPaymentPage;
