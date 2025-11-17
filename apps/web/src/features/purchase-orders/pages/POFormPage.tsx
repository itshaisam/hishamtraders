import React from 'react';
import { useNavigate } from 'react-router-dom';
import { POForm } from '../components/POForm';
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders';

/**
 * POFormPage - Full page for creating a new purchase order
 * Replaces the modal from the old UI
 */
export const POFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createPO, isPending } = useCreatePurchaseOrder();

  const handleSubmit = async (data: any) => {
    createPO(data, {
      onSuccess: () => {
        navigate('/purchase-orders');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="mt-2 text-gray-600">
            Create a new purchase order. Add order details and line items below.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <POForm onSubmit={handleSubmit} isLoading={isPending} />
        </div>
      </div>
    </div>
  );
};
