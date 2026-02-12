import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stockTransferService } from '../../../services/stockTransferService';
import { TransferStatus, StockTransfer } from '../../../types/stock-transfer.types';

const statusColors: Record<TransferStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_TRANSIT: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function StockTransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfer', id],
    queryFn: () => stockTransferService.getById(id!),
    enabled: !!id,
  });

  const transfer: StockTransfer | null = data?.data || null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stock-transfer', id] });

  const approveMutation = useMutation({
    mutationFn: () => stockTransferService.approve(id!),
    onSuccess: () => { toast.success('Transfer approved'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const dispatchMutation = useMutation({
    mutationFn: () => stockTransferService.dispatch(id!),
    onSuccess: () => { toast.success('Transfer dispatched'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const items = (transfer?.items || []).map((item) => ({
        itemId: item.id,
        receivedQuantity: receivedQuantities[item.id] ?? item.quantity,
      }));
      return stockTransferService.receive(id!, items);
    },
    onSuccess: () => { toast.success('Transfer received'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => stockTransferService.cancel(id!, cancelReason),
    onSuccess: () => { toast.success('Transfer cancelled'); setShowCancelModal(false); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20"></div></div>;
  if (!transfer) return <div className="p-6 text-center text-gray-500">Transfer not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{transfer.transferNumber}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColors[transfer.status]}`}>
            {transfer.status.replace('_', ' ')}
          </span>
        </div>
        <button onClick={() => navigate('/stock-transfers')} className="text-sm text-gray-600 hover:text-gray-800">Back to List</button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Transfer Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">From:</span><span className="font-medium">{transfer.sourceWarehouse.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">To:</span><span className="font-medium">{transfer.destinationWarehouse.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Requested by:</span><span>{transfer.requester.name}</span></div>
            {transfer.approver && <div className="flex justify-between"><span className="text-gray-500">Approved by:</span><span>{transfer.approver.name}</span></div>}
            {transfer.dispatcherName && <div className="flex justify-between"><span className="text-gray-500">Dispatched by:</span><span>{transfer.dispatcherName}</span></div>}
            {transfer.completerName && <div className="flex justify-between"><span className="text-gray-500">Received by:</span><span>{transfer.completerName}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Created:</span><span>{new Date(transfer.createdAt).toLocaleString()}</span></div>
          </div>
          {transfer.notes && <p className="mt-3 text-sm text-gray-600 border-t pt-2">{transfer.notes}</p>}
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
          <div className="space-y-2">
            {transfer.status === 'PENDING' && (
              <>
                <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {approveMutation.isPending ? 'Approving...' : 'Approve Transfer'}
                </button>
                <button onClick={() => setShowCancelModal(true)} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">Cancel Transfer</button>
              </>
            )}
            {transfer.status === 'APPROVED' && (
              <>
                <button onClick={() => dispatchMutation.mutate()} disabled={dispatchMutation.isPending} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {dispatchMutation.isPending ? 'Dispatching...' : 'Dispatch Transfer'}
                </button>
                <button onClick={() => setShowCancelModal(true)} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">Cancel Transfer</button>
              </>
            )}
            {transfer.status === 'IN_TRANSIT' && (
              <>
                <button onClick={() => receiveMutation.mutate()} disabled={receiveMutation.isPending} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {receiveMutation.isPending ? 'Receiving...' : 'Receive Transfer'}
                </button>
                <button onClick={() => setShowCancelModal(true)} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">Cancel Transfer</button>
              </>
            )}
            {(transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') && (
              <p className="text-sm text-gray-500">No actions available</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Items</h3></div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent Qty</th>
              {transfer.status === 'IN_TRANSIT' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received Qty</th>}
              {transfer.status === 'COMPLETED' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received Qty</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfer.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{item.product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.product.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.batchNo || '-'}</td>
                <td className="px-6 py-4 text-sm text-right">{item.quantity}</td>
                {transfer.status === 'IN_TRANSIT' && (
                  <td className="px-6 py-4 text-right">
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                      value={receivedQuantities[item.id] ?? item.quantity}
                      onChange={(e) => setReceivedQuantities({ ...receivedQuantities, [item.id]: parseInt(e.target.value) || 0 })}
                    />
                  </td>
                )}
                {transfer.status === 'COMPLETED' && (
                  <td className="px-6 py-4 text-sm text-right">{item.receivedQuantity ?? item.quantity}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCancelModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold mb-4">Cancel Transfer</h2>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Reason for cancellation (min 5 characters)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg">Close</button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelReason.length < 5 || cancelMutation.isPending}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
