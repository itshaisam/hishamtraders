import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SupplierForm } from '../components/SupplierForm';
import { useSupplier, useUpdateSupplier } from '../hooks/useSuppliers';
import { Spinner, Button } from '../../../components/ui';

/**
 * SupplierDetailPage - Full page for editing an existing supplier
 * Replaces the modal from the old UI
 */
export const SupplierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useSupplier(id || '');
  const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier();

  // Extract supplier data from API response
  const supplier = response?.data;

  const handleSubmit = async (data: any) => {
    if (!id) return;
    updateSupplier(
      { id, data },
      {
        onSuccess: () => {
          navigate('/suppliers');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Supplier Not Found</h2>
            <p className="text-red-700 mb-4">The supplier you're looking for doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={() => navigate('/suppliers')}>
              Back to Suppliers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header with back button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Supplier</h1>
            <p className="mt-2 text-gray-600">Update supplier information</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <SupplierForm supplier={supplier} onSubmit={handleSubmit} isLoading={isUpdating} />
        </div>
      </div>
    </div>
  );
};
