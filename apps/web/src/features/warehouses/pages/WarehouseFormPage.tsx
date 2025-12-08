import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WarehouseForm } from '../components/WarehouseForm';
import { useCreateWarehouse } from '@/hooks/useWarehouses';
import { Breadcrumbs } from '@/components/ui';

export const WarehouseFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createWarehouse, isPending } = useCreateWarehouse();

  const handleSubmit = async (data: any) => {
    createWarehouse(
      {
        ...data,
        location: data.location || undefined,
        city: data.city || undefined,
      },
      {
        onSuccess: () => {
          navigate('/warehouses');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        <Breadcrumbs
          items={[
            { label: 'Warehouses', href: '/warehouses' },
            { label: 'Create New Warehouse' },
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Warehouse</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Add a new warehouse location to your system.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
          <WarehouseForm onSubmit={handleSubmit} isLoading={isPending} />
        </div>
      </div>
    </div>
  );
};
