import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductList } from '../components/ProductList';
import { Product, CreateProductRequest, UpdateProductRequest } from '../types/product.types';
import { useAuthStore } from '@/stores/auth.store';

const PRODUCT_CATEGORIES = ['Sinks', 'Faucets', 'Toilets', 'Showers', 'Accessories'];

export const ProductsPage: React.FC = () => {
  const user = useAuthStore((state: any) => state.user);
  const canEdit = user?.role?.name && ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role.name);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useProducts({
    search: searchTerm,
    category: selectedCategory,
    page,
    limit: 10,
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleCreate = useCallback(() => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}" (${product.sku})?`)) {
      setDeletingId(product.id);
      deleteMutation.mutate(product.id, {
        onSettled: () => setDeletingId(null),
      });
    }
  }, [deleteMutation]);

  const handleSubmit = useCallback(
    async (formData: CreateProductRequest | UpdateProductRequest) => {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: formData as UpdateProductRequest,
        });
      } else {
        await createMutation.mutateAsync(formData as CreateProductRequest);
      }
    },
    [editingProduct, createMutation, updateMutation]
  );

  const products = useMemo(() => data?.data || [], [data]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-gray-600">Manage product catalog and pricing</p>
          </div>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} />
              New Product
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by SKU or Name
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

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ProductList
            products={products}
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

      {/* Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEditMode={!!editingProduct}
      />
    </div>
  );
};
