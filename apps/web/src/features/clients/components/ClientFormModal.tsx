import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useClient, useCreateClient, useUpdateClient } from '../../../hooks/useClients';
import { CreateClientDto, ClientStatus } from '../../../types/client.types';

interface ClientFormModalProps {
  clientId?: string;
  onClose: () => void;
}

export function ClientFormModal({ clientId, onClose }: ClientFormModalProps) {
  const isEditing = !!clientId;
  const { data: clientData } = useClient(clientId || '');
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientDto>({
    defaultValues: {
      status: 'ACTIVE',
      creditLimit: 0,
      paymentTermsDays: 30,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (clientData?.data) {
      reset({
        name: clientData.data.name,
        contactPerson: clientData.data.contactPerson || '',
        phone: clientData.data.phone || '',
        email: clientData.data.email || '',
        city: clientData.data.city || '',
        area: clientData.data.area || '',
        creditLimit: clientData.data.creditLimit,
        paymentTermsDays: clientData.data.paymentTermsDays,
        status: clientData.data.status,
      });
    }
  }, [clientData, reset]);

  const onSubmit = async (data: CreateClientDto) => {
    try {
      if (isEditing && clientId) {
        await updateClient.mutateAsync({ id: clientId, data });
      } else {
        await createClient.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Client Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Client name is required' })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Person</label>
              <input
                type="text"
                {...register('contactPerson')}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Email */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* City */}
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <input
                type="text"
                {...register('city')}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Area */}
            <div>
              <label className="mb-1 block text-sm font-medium">Area</label>
              <input
                type="text"
                {...register('area')}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Credit Limit */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Credit Limit (Rs.) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('creditLimit', {
                  required: 'Credit limit is required',
                  min: { value: 0, message: 'Credit limit cannot be negative' },
                  valueAsNumber: true,
                })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              {errors.creditLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Set to 0 for cash-only clients
              </p>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Payment Terms (Days) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                {...register('paymentTermsDays', {
                  required: 'Payment terms are required',
                  min: { value: 1, message: 'Payment terms must be at least 1 day' },
                  valueAsNumber: true,
                })}
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
              {errors.paymentTermsDays && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentTermsDays.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                e.g., 7 for weekly, 30 for monthly
              </p>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                {...register('status')}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClient.isPending || updateClient.isPending}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createClient.isPending || updateClient.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Client'
                : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
