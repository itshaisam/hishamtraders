import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
} from '../hooks/usePurchaseOrders';
import { POList } from '../components/POList';
import { POListSkeleton } from '../components/POListSkeleton';
import {
  PurchaseOrder,
  POStatus,
} from '../types/purchase-order.types';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Breadcrumbs, RadioBadgeGroup } from '@/components/ui';

const PO_STATUSES: POStatus[] = ['PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];

export const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const canCreate = user?.role?.name && ['ADMIN', 'ACCOUNTANT'].includes(user.role.name);

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

  const deleteMutation = useDeletePurchaseOrder();

  const handleCreate = useCallback(() => {
    navigate('/purchase-orders/new');
  }, [navigate]);

  const handleView = useCallback((po: PurchaseOrder) => {
    navigate(`/purchase-orders/${po.id}/view`);
  }, [navigate]);

  const handleEdit = useCallback((po: PurchaseOrder) => {
    navigate(`/purchase-orders/${po.id}`);
  }, [navigate]);

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

  const pos = useMemo(() => data?.data || [], [data]);

  // Show skeleton while loading initial data
  if (isLoading && pos.length === 0) {
    return <POListSkeleton />;
  }

  return (
    <div className="p-6">
        <Breadcrumbs
          items={[{ label: 'Purchases', href: '/purchase-orders' }, { label: 'Purchase Orders' }]}
          className="mb-4"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage supplier purchase orders and tracking
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={handleCreate}
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
              className="w-full sm:w-auto"
            >
              New PO
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <RadioBadgeGroup
                name="po-status"
                value={selectedStatus}
                onChange={(value: string) => {
                  setSelectedStatus(value as POStatus | '');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All', color: 'gray' },
                  { value: 'PENDING', label: 'Pending', color: 'blue' },
                  { value: 'IN_TRANSIT', label: 'In Transit', color: 'yellow' },
                  { value: 'RECEIVED', label: 'Received', color: 'green' },
                  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
                ]}
              />
            </div>

            {/* Info - Responsive */}
            <div className="md:flex md:items-end">
              <div className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-700">
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canCreate || false}
          />
        </div>

        {/* Pagination - Responsive Stack/Flex */}
        {data && data.pagination.pages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              Showing page {data.pagination.page} of {data.pagination.pages} (
              {data.pagination.total} total)
            </p>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(data.pagination.pages, p + 1))
                }
                disabled={page === data.pagination.pages}
                className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  );
};
