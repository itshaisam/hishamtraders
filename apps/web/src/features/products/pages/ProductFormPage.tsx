import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '../components/ProductForm';
import { useCreateProduct } from '../hooks/useProducts';
import { Breadcrumbs } from '../../../components/ui';

/**
 * ProductFormPage - Full page for creating a new product
 * Replaces the modal from the old UI
 */
export const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createProduct, isPending } = useCreateProduct();

  const handleSubmit = async (data: any) => {
    createProduct(data, {
      onSuccess: () => {
        navigate('/products');
      },
    });
  };

  return (
    <div className="p-6">
      {/* Breadcrumbs - Responsive */}
      <Breadcrumbs
        items={[
          { label: 'Inventory', href: '/stock-levels' },
          { label: 'Products', href: '/products' },
          { label: 'Create New Product' },
        ]}
        className="mb-4"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Product</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Add a new product to your catalog. All required fields must be filled.
          </p>
        </div>
      </div>

      {/* Form Card - Full width on mobile, wider on desktop */}
      <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
        <ProductForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </div>
  );
};
