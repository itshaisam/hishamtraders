import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoodsReceipt, useCancelGRN } from '../hooks/useGoodsReceipts';
import { GRNStatusBadge } from '../components/GRNStatusBadge';
import { GRNItemsTable } from '../components/GRNItemsTable';
import { GRNAdditionalCostsTable } from '../components/GRNAdditionalCostsTable';
import { GRNLandedCostBreakdown } from '../components/GRNLandedCostBreakdown';
import { Button, Breadcrumbs, Spinner, Modal } from '../../../components/ui';

export const GoodsReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: response, isLoading, isError } = useGoodsReceipt(id || '');
  const cancelGRN = useCancelGRN();

  const grn = response?.data;

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelGRN.mutateAsync(id);
      toast.success('Goods Receipt Note cancelled successfully');
      setShowCancelModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel GRN');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (isError || !grn) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Goods Receipt Not Found</h2>
          <Button variant="primary" onClick={() => navigate('/goods-receipts')}>
            Back to Goods Receipts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Goods Receipts', href: '/goods-receipts' },
          { label: grn.grnNumber },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
        <button
          onClick={() => navigate('/goods-receipts')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Goods Receipt Note</h1>
          <p className="mt-1 text-sm text-gray-600">{grn.grnNumber}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {grn.status === 'COMPLETED' && (
            <>
              <button
                onClick={() => navigate(`/purchase-invoices/new?grnId=${grn.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FileText size={16} />
                Create Purchase Invoice
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <XCircle size={16} />
                Cancel GRN
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">GRN Number</label>
            <p className="text-lg font-mono font-semibold text-blue-600">{grn.grnNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            <GRNStatusBadge status={grn.status} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Received Date</label>
            <p className="text-gray-900">
              {new Date(grn.receivedDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Purchase Order</label>
            <Link
              to={`/purchase-orders/${grn.poId}/view`}
              className="text-blue-600 hover:underline font-medium"
            >
              {grn.purchaseOrder?.poNumber || grn.poId}
            </Link>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Supplier</label>
            <p className="text-gray-900">{grn.purchaseOrder?.supplier?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Warehouse</label>
            <p className="text-gray-900">{grn.warehouse?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
            <p className="text-gray-900">{grn.creator?.name || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
            <p className="text-gray-700 text-sm">{new Date(grn.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {grn.notes && (
          <>
            <hr className="border-gray-200" />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
              <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded p-3">{grn.notes}</p>
            </div>
          </>
        )}

        <hr className="border-gray-200" />

        {/* Items */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Received Items</h2>
          <GRNItemsTable items={grn.items} />
        </div>
      </div>

      {/* Additional Costs */}
      <GRNAdditionalCostsTable grn={grn} />

      {/* Landed Cost Breakdown - only show when costs exist */}
      {(grn.costs?.length || 0) > 0 && <GRNLandedCostBreakdown grnId={grn.id} />}

      <div className="flex gap-4 justify-end">
        <Button variant="secondary" onClick={() => navigate('/goods-receipts')}>
          Back to Goods Receipts
        </Button>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Goods Receipt"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel GRN <strong>{grn.grnNumber}</strong>?
            This will reverse all inventory updates and stock movements.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              No, Keep It
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={cancelGRN.isPending}
            >
              {cancelGRN.isPending ? 'Cancelling...' : 'Yes, Cancel GRN'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
