import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PurchaseOrder, UpdateImportDetailsRequest } from '../types/purchase-order.types';
import { useUpdateImportDetails } from '../hooks/usePurchaseOrders';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';

interface ImportDocumentationSectionProps {
  po: PurchaseOrder;
}

const importDetailsSchema = z.object({
  containerNo: z.string().optional(),
  shipDate: z.string().optional(),
  arrivalDate: z.string().optional(),
});

type ImportDetailsFormData = z.infer<typeof importDetailsSchema>;

export const ImportDocumentationSection: React.FC<ImportDocumentationSectionProps> = ({ po }) => {
  const user = useAuthStore((state: any) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const updateImportDetails = useUpdateImportDetails(po.id);

  // Only ADMIN and ACCOUNTANT can edit
  const canEdit = user?.role?.name === 'ADMIN' || user?.role?.name === 'ACCOUNTANT';

  // Only show section when PO is IN_TRANSIT or RECEIVED
  if (po.status !== 'IN_TRANSIT' && po.status !== 'RECEIVED') {
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ImportDetailsFormData>({
    resolver: zodResolver(importDetailsSchema),
    defaultValues: {
      containerNo: po.containerNo || '',
      shipDate: po.shipDate ? format(new Date(po.shipDate), 'yyyy-MM-dd') : '',
      arrivalDate: po.arrivalDate ? format(new Date(po.arrivalDate), 'yyyy-MM-dd') : '',
    },
  });

  const onSubmit = (data: ImportDetailsFormData) => {
    const payload: UpdateImportDetailsRequest = {
      containerNo: data.containerNo || undefined,
      shipDate: data.shipDate || undefined,
      arrivalDate: data.arrivalDate || undefined,
    };

    updateImportDetails.mutate(payload, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Import Documentation</h3>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Container Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Container Number
            </label>
            {isEditing ? (
              <input
                {...register('containerNo')}
                type="text"
                placeholder="ABCD1234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">
                {po.containerNo || <span className="text-gray-400">Not set</span>}
              </p>
            )}
            {errors.containerNo && (
              <p className="mt-1 text-sm text-red-600">{errors.containerNo.message}</p>
            )}
          </div>

          {/* Ship Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ship Date</label>
            {isEditing ? (
              <input
                {...register('shipDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">
                {po.shipDate ? (
                  format(new Date(po.shipDate), 'MMM dd, yyyy')
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </p>
            )}
            {errors.shipDate && (
              <p className="mt-1 text-sm text-red-600">{errors.shipDate.message}</p>
            )}
          </div>

          {/* Arrival Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arrival Date
            </label>
            {isEditing ? (
              <input
                {...register('arrivalDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">
                {po.arrivalDate ? (
                  format(new Date(po.arrivalDate), 'MMM dd, yyyy')
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </p>
            )}
            {errors.arrivalDate && (
              <p className="mt-1 text-sm text-red-600">{errors.arrivalDate.message}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateImportDetails.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {updateImportDetails.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
