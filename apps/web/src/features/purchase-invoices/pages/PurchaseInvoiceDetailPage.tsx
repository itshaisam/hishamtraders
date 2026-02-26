import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, XCircle, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  usePurchaseInvoice,
  usePurchaseInvoiceMatching,
  useCancelPurchaseInvoice,
} from '../../../hooks/usePurchaseInvoices';
import { PurchaseInvoiceStatus } from '../../../types/purchase-invoice.types';
import { Button, Breadcrumbs, Spinner, Modal } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import toast from 'react-hot-toast';

function getStatusBadge(status: PurchaseInvoiceStatus) {
  const map: Record<PurchaseInvoiceStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    PENDING: { label: 'Pending', variant: 'warning' },
    PARTIAL: { label: 'Partial', variant: 'info' },
    PAID: { label: 'Paid', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export const PurchaseInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: pi, isLoading, isError } = usePurchaseInvoice(id || '');
  const { data: matching, isLoading: matchingLoading } = usePurchaseInvoiceMatching(
    pi?.poId || pi?.grnId ? (id || '') : ''
  );
  const cancelPI = useCancelPurchaseInvoice();

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const handleCancel = async () => {
    if (!id || !cancelReason.trim()) {
      toast.error('Please provide a cancel reason');
      return;
    }
    try {
      await cancelPI.mutateAsync({ id, cancelReason: cancelReason.trim() });
      setShowCancelModal(false);
      setCancelReason('');
    } catch {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (isError || !pi) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Purchase Invoice Not Found</h2>
          <Button variant="primary" onClick={() => navigate('/purchase-invoices')}>
            Back to Purchase Invoices
          </Button>
        </div>
      </div>
    );
  }

  const status = pi.status as PurchaseInvoiceStatus;
  const outstanding = Number(pi.total) - Number(pi.paidAmount);
  const hasMatching = pi.poId || pi.grnId;

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Purchase Invoices', href: '/purchase-invoices' },
          { label: pi.internalNumber },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
        <button
          onClick={() => navigate('/purchase-invoices')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Invoice</h1>
          <p className="mt-1 text-sm text-gray-600">{pi.internalNumber}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(status === 'PENDING' || status === 'PARTIAL') && (
            <button
              onClick={() => navigate(`/payments/supplier/record`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <DollarSign size={16} />
              Record Payment
            </button>
          )}
          {status === 'PENDING' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <XCircle size={16} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Detail Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Internal Number</label>
            <p className="text-lg font-mono font-semibold text-blue-600">{pi.internalNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Supplier Invoice #</label>
            <p className="text-gray-900 font-medium">{pi.invoiceNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            {getStatusBadge(status)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
            <p className="text-gray-900 font-medium">{pi.supplier?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Invoice Date</label>
            <p className="text-gray-900">
              {new Date(pi.invoiceDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          {pi.dueDate && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
              <p className="text-gray-900">
                {new Date(pi.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          )}
          {pi.purchaseOrder && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Purchase Order</label>
              <Link
                to={`/purchase-orders/${pi.poId}/view`}
                className="text-blue-600 hover:underline font-mono font-medium"
              >
                {pi.purchaseOrder.poNumber}
              </Link>
            </div>
          )}
          {pi.goodsReceiveNote && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Goods Receipt</label>
              <Link
                to={`/goods-receipts/${pi.grnId}`}
                className="text-blue-600 hover:underline font-mono font-medium"
              >
                {pi.goodsReceiveNote.grnNumber}
              </Link>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
            <p className="text-gray-900">{pi.creator?.name || '-'}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <hr className="border-gray-200 my-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Subtotal</p>
            <p className="text-lg font-semibold">{formatCurrencyDecimal(Number(pi.subtotal), cs)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Tax ({Number(pi.taxRate)}%)</p>
            <p className="text-lg font-semibold">{formatCurrencyDecimal(Number(pi.taxAmount), cs)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-500 mb-1">Total</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrencyDecimal(Number(pi.total), cs)}</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${outstanding > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className={`text-xs mb-1 ${outstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>Outstanding</p>
            <p className={`text-lg font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrencyDecimal(outstanding, cs)}
            </p>
          </div>
        </div>

        {pi.notes && (
          <>
            <hr className="border-gray-200 my-4" />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded p-3">{pi.notes}</p>
            </div>
          </>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Variant</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Unit Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {pi.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.product?.name}</div>
                    <div className="text-xs text-gray-500">{item.product?.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.productVariant?.variantName || '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrencyDecimal(Number(item.unitCost), cs)}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrencyDecimal(Number(item.total), cs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Way Matching */}
      {hasMatching && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3-Way Matching</h2>
          {matchingLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : matching?.variances ? (
            <>
              {/* Summary */}
              {(() => {
                const varianceCount = matching.variances.filter(v => !v.qtyMatch || !v.costMatch).length;
                return varianceCount === 0 ? (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="text-green-800 font-medium">All items match</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <span className="text-amber-800 font-medium">{varianceCount} variance{varianceCount > 1 ? 's' : ''} found</span>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left font-semibold text-gray-900">Product</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-900">PO Qty</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-900">PO Cost</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-900">GRN Qty</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-900">PI Qty</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-900">PI Cost</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-900">Qty</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-900">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matching.variances.map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{v.productName}</div>
                          {v.variantName && <div className="text-xs text-gray-500">{v.variantName}</div>}
                        </td>
                        <td className="px-3 py-2 text-right">{v.poQty}</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyDecimal(v.poUnitCost, cs)}</td>
                        <td className="px-3 py-2 text-right">{v.grnQty}</td>
                        <td className="px-3 py-2 text-right">{v.piQty}</td>
                        <td className="px-3 py-2 text-right">{formatCurrencyDecimal(v.piUnitCost, cs)}</td>
                        <td className="px-3 py-2 text-center">
                          {v.qtyMatch ? (
                            <Badge variant="success" size="sm">Match</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Mismatch</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {v.costMatch ? (
                            <Badge variant="success" size="sm">Match</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Mismatch</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No matching data available</p>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="flex gap-4 justify-end">
        <Button variant="secondary" onClick={() => navigate('/purchase-invoices')}>
          Back to Purchase Invoices
        </Button>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        title="Cancel Purchase Invoice"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel <strong>{pi.internalNumber}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancel Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide a reason for cancellation..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
            >
              No, Keep It
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelPI.isPending || !cancelReason.trim()}
            >
              {cancelPI.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
