import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SupplierForm } from '../components/SupplierForm';
import { SupplierFormSkeleton } from '../components/SupplierFormSkeleton';
import { useCreateSupplier } from '../hooks/useSuppliers';

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
    return <SupplierFormSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        {/* Header - Responsive Text Sizing */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Supplier</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Add a new supplier to your system. All required fields must be filled.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <SupplierForm onSubmit={handleSubmit} isLoading={isPending} />
        </div>
      </div>
    </div>
  );
};
