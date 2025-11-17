import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { POForm } from '../components/POForm';
import { POFormSkeleton } from '../components/POFormSkeleton';
import { usePurchaseOrder, useUpdatePurchaseOrder } from '../hooks/usePurchaseOrders';
import { Spinner, Button, Breadcrumbs } from '../../../components/ui';

/**
 * PODetailPage - Full page for editing an existing purchase order
 * Replaces the modal from the old UI
 */
export const PODetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = usePurchaseOrder(id || '');
  const { mutate: updatePO, isPending: isUpdating } = useUpdatePurchaseOrder();

  // Extract PO data from API response
  const purchaseOrder = response?.data;

  const handleSubmit = async (data: any) => {
    if (!id) return;
    updatePO(
      { id, data },
      {
        onSuccess: () => {
          navigate('/purchase-orders');
        },
      }
    );
  };

  if (isLoading) {
    return <POFormSkeleton isEdit={true} />;
  }

  if (isError || !purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-red-700 mb-4">
              The purchase order you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="primary" onClick={() => navigate('/purchase-orders')}>
              Back to Orders
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
            { label: 'Purchase Orders', href: '/purchase-orders' },
            { label: purchaseOrder.poNumber },
          ]}
          className="text-xs sm:text-sm"
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Purchase Order</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Order ID: {purchaseOrder.id}</p>
          </div>
        </div>

        {/* Form Card - Full width on mobile, wider on desktop */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
          <POForm purchaseOrder={purchaseOrder} onSubmit={handleSubmit} isLoading={isUpdating} />
        </div>
      </div>
    </div>
  );
};
