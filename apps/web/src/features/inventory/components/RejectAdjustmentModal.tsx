import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRejectAdjustment } from '@/hooks/useStockAdjustments';
import toast from 'react-hot-toast';

interface RejectAdjustmentModalProps {
  adjustmentId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RejectAdjustmentModal: React.FC<RejectAdjustmentModalProps> = ({
  adjustmentId,
  productName,
  isOpen,
  onClose,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const { mutate: rejectAdjustment, isPending } = useRejectAdjustment();

  const handleReject = () => {
    if (rejectionReason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    rejectAdjustment(
      { id: adjustmentId, data: { rejectionReason } },
      {
        onSuccess: () => {
          toast.success('Adjustment rejected successfully');
          onClose();
          setRejectionReason('');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to reject adjustment');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
            <h3 className="text-lg font-medium text-red-900">Reject Stock Adjustment</h3>
            <button
              onClick={onClose}
              className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-gray-600">
              You are about to reject the stock adjustment for <strong>{productName}</strong>.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Please explain why this adjustment is being rejected (minimum 10 characters)"
              />
              <p className="mt-1 text-sm text-gray-500">
                {rejectionReason.length}/10 characters minimum
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ The warehouse manager will be notified of this rejection and the reason provided.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3">
            <button
              onClick={handleReject}
              disabled={isPending || rejectionReason.length < 10}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={20} className="animate-spin" />}
              Reject Adjustment
            </button>
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
