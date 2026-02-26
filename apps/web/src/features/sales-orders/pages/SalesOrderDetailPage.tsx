import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Lock, FileText, Truck } from 'lucide-react';
import {
  useSalesOrder,
  useConfirmSalesOrder,
  useCancelSalesOrder,
  useCloseSalesOrder,
} from '../../../hooks/useSalesOrders';
import { SalesOrderStatus } from '../../../types/sales-order.types';
import { Button, Breadcrumbs, Spinner, Modal } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import toast from 'react-hot-toast';

function getStatusBadge(status: SalesOrderStatus) {
  const map: Record<SalesOrderStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    DRAFT: { label: 'Draft', variant: 'default' },
    CONFIRMED: { label: 'Confirmed', variant: 'info' },
    PARTIALLY_DELIVERED: { label: 'Partially Delivered', variant: 'warning' },
    DELIVERED: { label: 'Delivered', variant: 'success' },
    PARTIALLY_INVOICED: { label: 'Partially Invoiced', variant: 'warning' },
    INVOICED: { label: 'Invoiced', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
    CLOSED: { label: 'Closed', variant: 'default' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export const SalesOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: order, isLoading, isError } = useSalesOrder(id || '');
  const confirmSO = useConfirmSalesOrder();
  const cancelSO = useCancelSalesOrder();
  const closeSO = useCloseSalesOrder();

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const handleConfirm = async () => {
    if (!id) return;
    try {
      await confirmSO.mutateAsync(id);
    } catch {
      // handled by mutation
    }
  };

  const handleCancel = async () => {
    if (!id || !cancelReason.trim()) {
      toast.error('Please provide a cancel reason');
      return;
    }
    try {
      await cancelSO.mutateAsync({ id, cancelReason: cancelReason.trim() });
      setShowCancelModal(false);
      setCancelReason('');
    } catch {
      // handled by mutation
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await closeSO.mutateAsync(id);
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

  if (isError || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Sales Order Not Found</h2>
          <Button variant="primary" onClick={() => navigate('/sales-orders')}>
            Back to Sales Orders
          </Button>
        </div>
      </div>
    );
  }

  const status = order.status as SalesOrderStatus;

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Sales', href: '/sales-orders' },
          { label: 'Sales Orders', href: '/sales-orders' },
          { label: order.orderNumber },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
        <button
          onClick={() => navigate('/sales-orders')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Sales Order</h1>
          <p className="mt-1 text-sm text-gray-600">{order.orderNumber}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {status === 'DRAFT' && (
            <>
              <button
                onClick={handleConfirm}
                disabled={confirmSO.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:bg-gray-400"
              >
                <CheckCircle size={16} />
                {confirmSO.isPending ? 'Confirming...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <XCircle size={16} />
                Cancel
              </button>
            </>
          )}
          {status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => navigate(`/delivery-notes/new?salesOrderId=${order.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Truck size={16} />
                Create Delivery Note
              </button>
              <button
                onClick={() => navigate(`/invoices/create?salesOrderId=${order.id}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FileText size={16} />
                Create Invoice
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <XCircle size={16} />
                Cancel
              </button>
            </>
          )}
          {(status === 'PARTIALLY_DELIVERED' || status === 'DELIVERED') && (
            <button
              onClick={() => navigate(`/invoices/create?salesOrderId=${order.id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FileText size={16} />
              Create Invoice
            </button>
          )}
          {status === 'INVOICED' && (
            <button
              onClick={handleClose}
              disabled={closeSO.isPending}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:bg-gray-400"
            >
              <Lock size={16} />
              {closeSO.isPending ? 'Closing...' : 'Close Order'}
            </button>
          )}
        </div>
      </div>

      {/* Order Header Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Order Number</label>
            <p className="text-lg font-mono font-semibold text-blue-600">{order.orderNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            {getStatusBadge(status)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Order Date</label>
            <p className="text-gray-900">
              {new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Customer</label>
            <p className="text-gray-900 font-medium">{order.client?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Warehouse</label>
            <p className="text-gray-900">{order.warehouse?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Type</label>
            <p className="text-gray-900">{order.paymentType}</p>
          </div>
          {order.expectedDeliveryDate && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Expected Delivery</label>
              <p className="text-gray-900">
                {new Date(order.expectedDeliveryDate).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
            <p className="text-gray-900">{order.creator?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
            <p className="text-gray-700 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {order.notes && (
          <>
            <hr className="border-gray-200 my-4" />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded p-3">
                {order.notes}
              </p>
            </div>
          </>
        )}

        {order.cancelReason && (
          <>
            <hr className="border-gray-200 my-4" />
            <div>
              <label className="block text-sm font-medium text-red-500 mb-1">Cancel Reason</label>
              <p className="text-red-800 whitespace-pre-wrap bg-red-50 rounded p-3">
                {order.cancelReason}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Variant</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Delivered</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Invoiced</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Remaining</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Discount</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => {
                const remainingDelivery = item.quantity - item.deliveredQuantity;
                const remainingInvoice = item.quantity - item.invoicedQuantity;
                return (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.product?.name}</div>
                      <div className="text-xs text-gray-500">{item.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.productVariant?.variantName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          item.deliveredQuantity >= item.quantity
                            ? 'text-green-600 font-medium'
                            : item.deliveredQuantity > 0
                            ? 'text-yellow-600 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {item.deliveredQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          item.invoicedQuantity >= item.quantity
                            ? 'text-green-600 font-medium'
                            : item.invoicedQuantity > 0
                            ? 'text-yellow-600 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {item.invoicedQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {remainingDelivery > 0 && (
                        <span className="text-orange-600" title="Remaining to deliver">
                          <Truck size={12} className="inline mr-1" />
                          {remainingDelivery}
                        </span>
                      )}
                      {remainingDelivery > 0 && remainingInvoice > 0 && ' / '}
                      {remainingInvoice > 0 && (
                        <span className="text-purple-600" title="Remaining to invoice">
                          <FileText size={12} className="inline mr-1" />
                          {remainingInvoice}
                        </span>
                      )}
                      {remainingDelivery === 0 && remainingInvoice === 0 && (
                        <CheckCircle size={14} className="inline text-green-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrencyDecimal(Number(item.unitPrice), cs)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {Number(item.discount) > 0 ? `${Number(item.discount)}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatCurrencyDecimal(Number(item.total), cs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={8} className="px-4 py-3 text-right font-semibold text-gray-700">
                  Subtotal:
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrencyDecimal(Number(order.subtotal), cs)}
                </td>
              </tr>
              <tr>
                <td colSpan={8} className="px-4 py-2 text-right text-gray-600">
                  Tax ({(Number(order.taxRate) * 100).toFixed(0)}%):
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {formatCurrencyDecimal(Number(order.taxAmount), cs)}
                </td>
              </tr>
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  Total:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  {formatCurrencyDecimal(Number(order.total), cs)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Linked Documents */}
      {((order.deliveryNotes && order.deliveryNotes.length > 0) ||
        (order.invoices && order.invoices.length > 0)) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Linked Documents</h2>

          {order.deliveryNotes && order.deliveryNotes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Delivery Notes</h3>
              <div className="space-y-2">
                {order.deliveryNotes.map((dn) => (
                  <div
                    key={dn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Truck size={16} className="text-gray-500" />
                      <Link
                        to={`/delivery-notes/${dn.id}`}
                        className="text-blue-600 hover:underline font-mono font-medium"
                      >
                        {dn.deliveryNoteNumber}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{new Date(dn.deliveryDate).toLocaleDateString()}</span>
                      <Badge
                        variant={
                          dn.status === 'DELIVERED'
                            ? 'success'
                            : dn.status === 'CANCELLED'
                            ? 'danger'
                            : 'info'
                        }
                        size="sm"
                      >
                        {dn.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.invoices && order.invoices.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Invoices</h3>
              <div className="space-y-2">
                {order.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-500" />
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline font-mono font-medium"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{formatCurrencyDecimal(Number(inv.total), cs)}</span>
                      <Badge
                        variant={
                          inv.status === 'PAID'
                            ? 'success'
                            : inv.status === 'CANCELLED' || inv.status === 'VOIDED'
                            ? 'danger'
                            : 'info'
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="flex gap-4 justify-end">
        <Button variant="secondary" onClick={() => navigate('/sales-orders')}>
          Back to Sales Orders
        </Button>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        title="Cancel Sales Order"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel order <strong>{order.orderNumber}</strong>?
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
              disabled={cancelSO.isPending || !cancelReason.trim()}
            >
              {cancelSO.isPending ? 'Cancelling...' : 'Yes, Cancel Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
