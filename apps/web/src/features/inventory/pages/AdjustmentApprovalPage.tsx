import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { usePendingAdjustments, useApproveAdjustment } from '@/hooks/useStockAdjustments';
import { useWarehousesForSelect } from '@/hooks/useWarehouses';
import { Breadcrumbs } from '@/components/ui';
import { RejectAdjustmentModal } from '../components/RejectAdjustmentModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const AdjustmentApprovalPage: React.FC = () => {
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<{
    id: string;
    productName: string;
  } | null>(null);

  const { data, isLoading } = usePendingAdjustments({
    warehouseId: warehouseFilter || undefined,
    page,
    limit: 50,
  });

  const { mutate: approveAdjustment, isPending: isApproving } = useApproveAdjustment();
  const { options: warehouseOptions } = useWarehousesForSelect();

  const adjustments = data?.data || [];
  const pagination = data?.pagination;

  const handleApprove = (id: string) => {
    if (window.confirm('Are you sure you want to approve this adjustment? This will update the inventory.')) {
      approveAdjustment(id, {
        onSuccess: (response) => {
          toast.success(response.message || 'Adjustment approved successfully');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to approve adjustment');
        },
      });
    }
  };

  const handleRejectClick = (id: string, productName: string) => {
    setSelectedAdjustment({ id, productName });
    setRejectModalOpen(true);
  };

  const getAdjustmentTypeColor = (quantity: number) => {
    return quantity > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6">
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/stock-levels' },
            { label: 'Adjustment Approvals' },
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment Approvals</h1>
          <p className="mt-2 text-gray-600">Review and approve pending stock adjustments</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <span className="font-semibold">{pagination?.total || 0}</span> pending adjustment
            {(pagination?.total || 0) !== 1 ? 's' : ''} awaiting approval
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading pending adjustments...</div>
          ) : adjustments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <CheckCircle size={48} className="mx-auto" />
              </div>
              <p className="text-gray-500">No pending adjustments. All caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(adjustment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{adjustment.product.name}</div>
                        <div className="text-gray-500">{adjustment.product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adjustment.warehouse.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs">
                          {adjustment.adjustmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={getAdjustmentTypeColor(adjustment.quantity)}>
                          {adjustment.quantity > 0 ? '+' : ''}
                          {adjustment.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        <p className="line-clamp-2">{adjustment.reason}</p>
                        {adjustment.notes && (
                          <p className="text-xs text-gray-400 mt-1">Notes: {adjustment.notes}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {adjustment.creator.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(adjustment.id)}
                            disabled={isApproving}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
                          >
                            {isApproving ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleRejectClick(adjustment.id, adjustment.product.name)
                            }
                            disabled={isApproving}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * (pagination.limit || 50) + 1} to{' '}
                {Math.min(page * (pagination.limit || 50), pagination.total)} of {pagination.total}{' '}
                adjustments
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Reject Modal */}
      {selectedAdjustment && (
        <RejectAdjustmentModal
          adjustmentId={selectedAdjustment.id}
          productName={selectedAdjustment.productName}
          isOpen={rejectModalOpen}
          onClose={() => {
            setRejectModalOpen(false);
            setSelectedAdjustment(null);
          }}
        />
      )}
    </div>
  );
};
