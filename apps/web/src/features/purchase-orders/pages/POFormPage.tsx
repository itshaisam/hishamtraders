import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { POForm } from '../components/POForm';
import { POFormSkeleton } from '../components/POFormSkeleton';
import { useCreatePurchaseOrder } from '../hooks/usePurchaseOrders';
import { Breadcrumbs } from '../../../components/ui';

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

  // Show skeleton on initial load
  if (isPending) {
    return <POFormSkeleton isEdit={false} />;
  }

  return (
    <div className="p-6">
      {/* Breadcrumbs - Responsive */}
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Purchase Orders', href: '/purchase-orders' },
          { label: 'Create New Order' },
        ]}
        className="mb-4"
      />

      {/* Header with back button - Responsive Flex */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
        <button
          onClick={() => navigate('/purchase-orders')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Go back to purchase orders"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Create a new purchase order. Add order details and line items below.
          </p>
        </div>
      </div>

      {/* Form Card - Full width on mobile, wider on desktop */}
      <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
        <POForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </div>
  );
};
