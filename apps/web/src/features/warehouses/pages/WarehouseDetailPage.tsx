import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { WarehouseForm } from '../components/WarehouseForm';
import { useWarehouse, useUpdateWarehouse } from '@/hooks/useWarehouses';
import { Breadcrumbs } from '@/components/ui';

export const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: warehouseData, isLoading: isLoadingWarehouse } = useWarehouse(id!);
  const { mutate: updateWarehouse, isPending: isUpdating } = useUpdateWarehouse();

  const handleSubmit = async (data: any) => {
    if (!id) return;

    updateWarehouse(
      {
        id,
        data: {
          ...data,
          location: data.location || undefined,
          city: data.city || undefined,
        },
      },
      {
        onSuccess: () => {
          navigate('/warehouses');
        },
      }
    );
  };

  if (isLoadingWarehouse) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!warehouseData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Warehouse not found</h2>
            <button
              onClick={() => navigate('/warehouses')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Go back to warehouses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const warehouse = warehouseData.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Warehouses', href: '/warehouses' },
            { label: warehouse.name },
          ]}
          className="text-xs sm:text-sm"
        />

        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate('/warehouses')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to warehouses"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Warehouse</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Update warehouse details and location information.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
          <WarehouseForm warehouse={warehouse} onSubmit={handleSubmit} isLoading={isUpdating} />
        </div>
      </div>
    </div>
  );
};
