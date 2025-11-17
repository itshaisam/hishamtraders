import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useSuppliers, useDeleteSupplier } from '../hooks/useSuppliers';
import { SupplierList } from '../components/SupplierList';
import { Supplier } from '../types/supplier.types';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const canEdit = user?.role?.name && ['ADMIN', 'ACCOUNTANT'].includes(user.role.name);

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useSuppliers({
    search: searchTerm,
    page,
    limit: 10,
  });

  const deleteMutation = useDeleteSupplier();

  const handleCreate = useCallback(() => {
    navigate('/suppliers/new');
  }, [navigate]);

  const handleEdit = useCallback((supplier: Supplier) => {
    navigate(`/suppliers/${supplier.id}`);
  }, [navigate]);

  const handleDelete = useCallback((supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      setDeletingId(supplier.id);
      deleteMutation.mutate(supplier.id, {
        onSettled: () => setDeletingId(null),
      });
    }
  }, [deleteMutation]);

  const suppliers = useMemo(() => data?.data || [], [data]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="mt-1 text-gray-600">Manage supplier information and payment terms</p>
          </div>
          {canEdit && (
            <Button
              onClick={handleCreate}
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
            >
              New Supplier
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search suppliers by name, contact person, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Supplier List */}
        <div className="bg-white rounded-lg shadow">
          <SupplierList
            suppliers={suppliers}
            isLoading={isLoading || deletingId !== null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
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
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
