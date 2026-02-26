import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle, XCircle, FileText, AlertTriangle } from 'lucide-react';
import {
  useDeliveryNote,
  useDispatchDeliveryNote,
  useDeliverDeliveryNote,
  useCancelDeliveryNote,
} from '../../../hooks/useDeliveryNotes';
import { DeliveryNoteStatus } from '../../../types/delivery-note.types';
import { Button, Breadcrumbs, Spinner, Modal } from '../../../components/ui';
import Badge from '../../../components/ui/Badge';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import toast from 'react-hot-toast';

function getStatusBadge(status: DeliveryNoteStatus) {
  const map: Record<DeliveryNoteStatus, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
    PENDING: { label: 'Pending', variant: 'warning' },
    DISPATCHED: { label: 'Dispatched', variant: 'info' },
    DELIVERED: { label: 'Delivered', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'danger' },
  };
  const info = map[status] || { label: status, variant: 'default' as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export const DeliveryNoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: dn, isLoading, isError } = useDeliveryNote(id || '');
  const dispatchDN = useDispatchDeliveryNote();
  const deliverDN = useDeliverDeliveryNote();
  const cancelDN = useCancelDeliveryNote();

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const handleDispatch = async () => {
    if (!id) return;
    try {
      await dispatchDN.mutateAsync(id);
      setShowDispatchModal(false);
    } catch {
      // handled by mutation
    }
  };

  const handleDeliver = async () => {
    if (!id) return;
    try {
      await deliverDN.mutateAsync(id);
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
      await cancelDN.mutateAsync({ id, cancelReason: cancelReason.trim() });
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

  if (isError || !dn) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Delivery Note Not Found</h2>
          <Button variant="primary" onClick={() => navigate('/delivery-notes')}>
            Back to Delivery Notes
          </Button>
        </div>
      </div>
    );
  }

  const status = dn.status as DeliveryNoteStatus;

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Sales', href: '/sales-orders' },
          { label: 'Delivery Notes', href: '/delivery-notes' },
          { label: dn.deliveryNoteNumber },
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
        <button
          onClick={() => navigate('/delivery-notes')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Note</h1>
          <p className="mt-1 text-sm text-gray-600">{dn.deliveryNoteNumber}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {status === 'PENDING' && (
            <>
              <button
                onClick={() => setShowDispatchModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Truck size={16} />
                Dispatch
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
          {status === 'DISPATCHED' && (
            <>
              <button
                onClick={handleDeliver}
                disabled={deliverDN.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:bg-gray-400"
              >
                <CheckCircle size={16} />
                {deliverDN.isPending ? 'Marking...' : 'Mark Delivered'}
              </button>
              <button
                onClick={() => navigate(`/invoices/create?deliveryNoteId=${dn.id}`)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FileText size={16} />
                Create Invoice
              </button>
            </>
          )}
          {status === 'DELIVERED' && (
            <button
              onClick={() => navigate(`/invoices/create?deliveryNoteId=${dn.id}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FileText size={16} />
              Create Invoice
            </button>
          )}
        </div>
      </div>

      {/* Detail Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">DN Number</label>
            <p className="text-lg font-mono font-semibold text-blue-600">{dn.deliveryNoteNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            {getStatusBadge(status)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
            <p className="text-gray-900">
              {new Date(dn.deliveryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Customer</label>
            <p className="text-gray-900 font-medium">{dn.client?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Warehouse</label>
            <p className="text-gray-900">{dn.warehouse?.name || '-'}</p>
          </div>
          {dn.salesOrder && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Sales Order</label>
              <Link
                to={`/sales-orders/${dn.salesOrderId}`}
                className="text-blue-600 hover:underline font-mono font-medium"
              >
                {dn.salesOrder.orderNumber}
              </Link>
            </div>
          )}
          {dn.driverName && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Driver</label>
              <p className="text-gray-900">{dn.driverName}</p>
            </div>
          )}
          {dn.vehicleNo && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Vehicle</label>
              <p className="text-gray-900">{dn.vehicleNo}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
            <p className="text-gray-900">{dn.creator?.name || '-'}</p>
          </div>
          {dn.dispatcher && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Dispatched By</label>
              <p className="text-gray-900">{dn.dispatcher.name}</p>
            </div>
          )}
          {dn.completer && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Delivered By</label>
              <p className="text-gray-900">{dn.completer.name}</p>
            </div>
          )}
        </div>

        {dn.deliveryAddress && (
          <>
            <hr className="border-gray-200 my-4" />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Address</label>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded p-3">
                {dn.deliveryAddress}
              </p>
            </div>
          </>
        )}

        {dn.notes && (
          <>
            <hr className="border-gray-200 my-4" />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded p-3">{dn.notes}</p>
            </div>
          </>
        )}

        {dn.cancelReason && (
          <>
            <hr className="border-gray-200 my-4" />
            <div>
              <label className="block text-sm font-medium text-red-500 mb-1">Cancel Reason</label>
              <p className="text-red-800 whitespace-pre-wrap bg-red-50 rounded p-3">
                {dn.cancelReason}
              </p>
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
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Batch #</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {dn.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.product?.name}</div>
                    <div className="text-xs text-gray-500">{item.product?.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {item.productVariant?.variantName || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono">{item.batchNo || '-'}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Invoices */}
      {dn.invoices && dn.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Linked Invoices</h2>
          <div className="space-y-2">
            {dn.invoices.map((inv) => (
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

      {/* Back Button */}
      <div className="flex gap-4 justify-end">
        <Button variant="secondary" onClick={() => navigate('/delivery-notes')}>
          Back to Delivery Notes
        </Button>
      </div>

      {/* Dispatch Confirmation Modal */}
      <Modal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        title="Dispatch Delivery Note"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-yellow-800 font-medium">Stock Deduction Warning</p>
              <p className="text-yellow-700 text-sm">
                Dispatching this delivery note will deduct stock from the warehouse. This action
                cannot be undone.
              </p>
            </div>
          </div>
          <p className="text-gray-700">
            Are you sure you want to dispatch <strong>{dn.deliveryNoteNumber}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDispatchModal(false)}>
              No, Keep Pending
            </Button>
            <Button
              variant="primary"
              onClick={handleDispatch}
              disabled={dispatchDN.isPending}
            >
              {dispatchDN.isPending ? 'Dispatching...' : 'Yes, Dispatch'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelReason('');
        }}
        title="Cancel Delivery Note"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel <strong>{dn.deliveryNoteNumber}</strong>?
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
              disabled={cancelDN.isPending || !cancelReason.trim()}
            >
              {cancelDN.isPending ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
