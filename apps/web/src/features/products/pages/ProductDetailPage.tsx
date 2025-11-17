import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '../components/ProductForm';
import { useProduct, useUpdateProduct } from '../hooks/useProducts';
import { Button, Breadcrumbs } from '../../../components/ui';

/**
 * ProductDetailPage - Full page for editing an existing product
 * Replaces the modal from the old UI
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useProduct(id || '');
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  // Extract product data from API response
  const product = response?.data;

  const handleSubmit = async (data: any) => {
    if (!id) return;
    updateProduct(
      { id, data },
      {
        onSuccess: () => {
          navigate('/products');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Product Not Found</h2>
            <p className="text-red-700 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* Breadcrumbs - Responsive */}
        <Breadcrumbs
          items={[
            { label: 'Products', href: '/products' },
            { label: product.name },
          ]}
          className="text-xs sm:text-sm"
        />

        {/* Header with back button - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to products"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Update product information and details</p>
          </div>
        </div>

        {/* Form Card - Full width on mobile, wider on desktop */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
          <ProductForm product={product} onSubmit={handleSubmit} isLoading={isUpdating} />
        </div>
      </div>
    </div>
  );
};
