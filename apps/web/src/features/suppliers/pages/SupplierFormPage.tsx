import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierFormSkeleton } from '../components/SupplierFormSkeleton';
import { useCreateSupplier } from '../hooks/useSuppliers';
import { Breadcrumbs } from '../../../components/ui';

/**
 * SupplierFormPage - Full page for creating a new supplier
 * Replaces the modal from the old UI
 */
export const SupplierFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createSupplier, isPending } = useCreateSupplier();

  const handleSubmit = async (data: any) => {
    createSupplier(data, {
      onSuccess: () => {
        navigate('/suppliers');
      },
    });
  };

  // Show skeleton on initial load
  if (isPending) {
    return <SupplierFormSkeleton isEdit={false} />;
  }

  return (
    <div className="p-6">
      {/* Breadcrumbs - Responsive */}
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Suppliers', href: '/suppliers' },
          { label: 'Create New Supplier' },
        ]}
        className="mb-4"
      />

      {/* Header with back button - Responsive Flex */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
        <button
          onClick={() => navigate('/suppliers')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Go back to suppliers"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Supplier</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Add a new supplier to your system. All required fields must be filled.
          </p>
        </div>
      </div>

      {/* Form Card - Full width on mobile, wider on desktop */}
      <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
        <SupplierForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </div>
  );
};
