import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useDeletePurchaseOrder,
} from '../hooks/usePurchaseOrders';
import { POFormModal } from '../components/POFormModal';
import { POList } from '../components/POList';
import {
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  POStatus,
} from '../types/purchase-order.types';
import { useAuthStore } from '@/stores/auth.store';

const PO_STATUSES: POStatus[] = ['PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];

export const PurchaseOrdersPage: React.FC = () => {
  const user = useAuthStore((state: any) => state.user);
  const canCreate = user?.role?.name && ['ADMIN', 'ACCOUNTANT'].includes(user.role.name);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<POStatus | ''>('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = usePurchaseOrders({
    search: searchTerm,
    status: selectedStatus as POStatus | undefined,
    page,
    limit: 10,
  });

  const createMutation = useCreatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();

  const handleCreate = useCallback(() => {
    setViewingPO(undefined);
    setIsModalOpen(true);
  }, []);

  const handleView = useCallback((po: PurchaseOrder) => {
    setViewingPO(po);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (po: PurchaseOrder) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${po.poNumber}"? This action cannot be undone.`
        )
      ) {
        setDeletingId(po.id);
        deleteMutation.mutate(po.id, {
          onSettled: () => setDeletingId(null),
        });
      }
    },
    [deleteMutation]
  );

  const handleSubmit = useCallback(
    async (formData: CreatePurchaseOrderRequest) => {
      await createMutation.mutateAsync(formData);
    },
    [createMutation]
  );

  const pos = useMemo(() => data?.data || [], [data]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="mt-1 text-gray-600">
              Manage supplier purchase orders and tracking
            </p>
          </div>
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} />
              New PO
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by PO Number or Supplier
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value as POStatus | '');
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {PO_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-end">
              <div className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Calendar size={16} className="inline mr-2" />
                Showing {data?.pagination?.total || 0} purchase orders
              </div>
            </div>
          </div>
        </div>

        {/* PO Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <POList
            pos={pos}
            isLoading={isLoading || deletingId !== null}
            onView={handleView}
            onEdit={handleCreate}
            onDelete={handleDelete}
            canEdit={canCreate || false}
          />
        </div>

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing page {data.pagination.page} of {data.pagination.pages} (
              {data.pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.pages, p + 1))
                }
                disabled={page === data.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <POFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setViewingPO(undefined);
        }}
        onSubmit={handleSubmit}
        purchaseOrder={viewingPO}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};
