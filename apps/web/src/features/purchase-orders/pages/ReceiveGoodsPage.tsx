import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePurchaseOrder, useReceiveGoods } from '../hooks/usePurchaseOrders';
import { ReceiveGoodsForm } from '../components/ReceiveGoodsForm';
import { POFormSkeleton } from '../components/POFormSkeleton';
import { Breadcrumbs } from '../../../components/ui';
import { ReceiveGoodsRequest } from '../types/purchase-order.types';

/**
 * ReceiveGoodsPage - Full page for receiving goods from a purchase order
 * Accessible only to ADMIN and WAREHOUSE_MANAGER roles
 */
export const ReceiveGoodsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = usePurchaseOrder(id || '');
  const receiveGoodsMutation = useReceiveGoods(id || '');

  const purchaseOrder = response?.data;

  const handleSubmit = async (data: ReceiveGoodsRequest) => {
    try {
      await receiveGoodsMutation.mutateAsync(data);
      // Navigate back to PO view page after successful receipt
      navigate(`/purchase-orders/${id}/view`);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Failed to receive goods:', error);
    }
  };

  if (isLoading) {
    return <POFormSkeleton isEdit={false} />;
  }

  if (isError || !purchaseOrder) {
    return (
      <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-red-700 mb-4">
              The purchase order you're looking for doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/purchase-orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Orders
            </button>
          </div>
      </div>
    );
  }

  // Check if PO can be received
  if (purchaseOrder.status === 'RECEIVED') {
    return (
      <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Already Received</h2>
            <p className="text-yellow-700 mb-4">
              This purchase order has already been received.
            </p>
            <button
              onClick={() => navigate(`/purchase-orders/${id}/view`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Purchase Order
            </button>
          </div>
      </div>
    );
  }

  if (purchaseOrder.status === 'CANCELLED') {
    return (
      <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Cannot Receive</h2>
            <p className="text-red-700 mb-4">
              This purchase order has been cancelled and cannot be received.
            </p>
            <button
              onClick={() => navigate(`/purchase-orders/${id}/view`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Purchase Order
            </button>
          </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Purchases', href: '/purchase-orders' },
            { label: 'Purchase Orders', href: '/purchase-orders' },
            { label: purchaseOrder.poNumber, href: `/purchase-orders/${id}/view` },
            { label: 'Receive Goods' },
          ]}
          className="mb-4"
        />

        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate(`/purchase-orders/${id}/view`)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to purchase order"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Receive Goods</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Receive goods from PO #{purchaseOrder.poNumber}
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <ReceiveGoodsForm
            purchaseOrder={purchaseOrder}
            onSubmit={handleSubmit}
            isLoading={receiveGoodsMutation.isPending}
          />
        </div>
    </div>
  );
};
