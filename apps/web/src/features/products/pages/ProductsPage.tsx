import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { ProductList } from '../components/ProductList';
import { Product } from '../types/product.types';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Breadcrumbs, RadioBadgeGroup } from '@/components/ui';

const PRODUCT_CATEGORIES = ['Sinks', 'Faucets', 'Toilets', 'Showers', 'Accessories'];

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const canEdit = user?.role?.name && ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role.name);

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

  const deleteMutation = useDeleteProduct();

  const handleCreate = useCallback(() => {
    navigate('/products/new');
  }, [navigate]);

  const handleEdit = useCallback((product: Product) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);

  const handleDelete = useCallback((product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}" (${product.sku})?`)) {
      setDeletingId(product.id);
      deleteMutation.mutate(product.id, {
        onSettled: () => setDeletingId(null),
      });
    }
  }, [deleteMutation]);

  const products = useMemo(() => data?.data || [], [data]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs - Responsive */}
        <div className="mb-6">
          <Breadcrumbs
            items={[{ label: 'Products' }]}
            className="text-xs sm:text-sm"
          />
        </div>

        {/* Header - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Manage product catalog and pricing</p>
          </div>
          {canEdit && (
            <Button
              onClick={handleCreate}
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
              className="w-full sm:w-auto"
            >
              New Product
            </Button>
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
              <RadioBadgeGroup
                name="category"
                value={selectedCategory}
                onChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Categories', color: 'gray' },
                  ...PRODUCT_CATEGORIES.map((cat) => ({
                    value: cat,
                    label: cat,
                    color: 'blue' as const,
                  })),
                ]}
              />
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
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
