import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Building2, User, Printer, CheckCircle, XOctagon } from 'lucide-react';
import { format } from 'date-fns';
import { useCreditNote, useVoidCreditNote, useApplyCreditNote } from '../../../hooks/useCreditNotes';
import { usePermission } from '../../../hooks/usePermission';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { VoidCreditNoteModal } from '../components/VoidCreditNoteModal';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

export function CreditNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: creditNote, isLoading, error } = useCreditNote(id!);
  const { hasRole } = usePermission();
  const voidMutation = useVoidCreditNote();
  const applyMutation = useApplyCreditNote();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  const canManage = hasRole(['ADMIN', 'ACCOUNTANT']);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'APPLIED':
        return 'bg-green-100 text-green-800';
      case 'VOIDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVoid = (reason: string) => {
    voidMutation.mutate(
      { id: id!, reason },
      {
        onSuccess: () => setShowVoidModal(false),
      }
    );
  };

  const handleApply = () => {
    applyMutation.mutate(id!, {
      onSuccess: () => setShowApplyConfirm(false),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading credit note...</div>
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">Failed to load credit note</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Sales', href: '/invoices' }, { label: 'Returns', href: '/returns' }, { label: creditNote?.creditNoteNumber || 'Credit Note Detail' }]} className="mb-4" />
      <div className="mb-6 print:hidden">
        <button
          onClick={() => navigate('/returns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Returns
        </button>
      </div>

      {/* Status Banners */}
      {creditNote.status === 'VOIDED' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 print:bg-red-50">
          <XOctagon className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">This credit note has been voided</p>
            <p className="text-sm text-red-700">
              All stock movements and balance adjustments have been reversed.
            </p>
          </div>
        </div>
      )}

      {creditNote.status === 'APPLIED' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 print:bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">This credit note has been applied</p>
            <p className="text-sm text-green-700">
              The credit has been applied to the client's account.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {creditNote.creditNoteNumber}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(creditNote.status)}`}
            >
              {creditNote.status}
            </span>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            {/* Action buttons (only for OPEN credit notes + authorized roles) */}
            {creditNote.status === 'OPEN' && canManage && (
              <>
                <button
                  onClick={() => setShowApplyConfirm(true)}
                  disabled={applyMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {applyMutation.isPending ? 'Applying...' : 'Mark as Applied'}
                </button>
                <button
                  onClick={() => setShowVoidModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <XOctagon size={16} />
                  Void Credit Note
                </button>
              </>
            )}
          </div>
        </div>

        {/* Date (print-visible, moved from old position) */}
        <div className="hidden print:block text-right mb-4">
          <p className="text-sm text-gray-600">Created</p>
          <p className="text-sm font-medium">
            {format(new Date(creditNote.createdAt), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <FileText className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Invoice</p>
              <button
                onClick={() => navigate(`/invoices/${creditNote.invoiceId}`)}
                className="font-semibold text-blue-600 hover:underline print:text-gray-900"
              >
                {creditNote.invoice.invoiceNumber}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <button
                onClick={() => navigate(`/clients/${creditNote.clientId}`)}
                className="font-semibold text-blue-600 hover:underline print:text-gray-900"
              >
                {creditNote.client.name}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Created By</p>
              <p className="font-semibold text-gray-900">{creditNote.creator.name}</p>
              <p className="text-xs text-gray-500">{creditNote.creator.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(creditNote.createdAt), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Return Reason</p>
          <p className="text-gray-900">{creditNote.reason}</p>
        </div>
      </div>

      {/* Returned Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Returned Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Batch</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Qty Returned</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Discount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {creditNote.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    {item.productVariant && (
                      <div className="text-xs text-gray-500">{item.productVariant.variantName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {item.productVariant?.sku || item.product.sku}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.batchNo || 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {item.quantityReturned}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">
                    {cs} {Number(item.unitPrice).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">{item.discount}%</td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {cs} {Number(item.total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">{cs} {Number(creditNote.subtotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax ({Number(creditNote.taxRate)}%):</span>
            <span className="font-medium">{cs} {Number(creditNote.taxAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-green-700 pt-3 border-t">
            <span>Total Credit:</span>
            <span>{cs} {Number(creditNote.totalAmount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Void Modal */}
      <VoidCreditNoteModal
        creditNote={creditNote}
        isOpen={showVoidModal}
        onClose={() => setShowVoidModal(false)}
        onConfirm={handleVoid}
        isLoading={voidMutation.isPending}
      />

      {/* Apply Confirmation Dialog */}
      {showApplyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Mark as Applied</h2>
            </div>
            <p className="text-gray-700 mb-2">
              Are you sure you want to mark credit note{' '}
              <span className="font-semibold">{creditNote.creditNoteNumber}</span> as applied?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This indicates the credit has been applied to the client's account. The client balance
              was already adjusted when the credit note was created.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApplyConfirm(false)}
                disabled={applyMutation.isPending}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {applyMutation.isPending ? 'Applying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
