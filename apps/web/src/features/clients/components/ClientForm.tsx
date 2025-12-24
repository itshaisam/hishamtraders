import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, FormField, RadioBadgeGroup } from '../../../components/ui';
import { Client, CreateClientDto } from '../../../types/client.types';

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Client name is required').min(2, 'Name must be at least 2 characters'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  city: z.string().optional(),
  area: z.string().optional(),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').default(0),
  paymentTermsDays: z.number().min(1, 'Payment terms must be at least 1 day').default(30),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onSubmit: (data: CreateClientDto) => Promise<void>;
  client?: Client;
  isLoading?: boolean;
}

/**
 * ClientForm - Reusable client form component
 * Can be used for both creating and editing clients
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  client,
  isLoading = false,
}) => {
  const [status, setStatus] = useState(client?.status || 'ACTIVE');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || '',
      contactPerson: client?.contactPerson || '',
      phone: client?.phone || '',
      email: client?.email || '',
      city: client?.city || '',
      area: client?.area || '',
      creditLimit: client?.creditLimit || 0,
      paymentTermsDays: client?.paymentTermsDays || 30,
      status: client?.status || 'ACTIVE',
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        contactPerson: client.contactPerson || '',
        phone: client.phone || '',
        email: client.email || '',
        city: client.city || '',
        area: client.area || '',
        creditLimit: client.creditLimit,
        paymentTermsDays: client.paymentTermsDays,
        status: client.status,
      });
      setStatus(client.status);
    }
  }, [client, reset]);

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Basic Information
        </h3>

        <FormField label="Client Name" error={errors.name?.message} required>
          <Input
            {...register('name')}
            type="text"
            placeholder="Enter client name"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="City" error={errors.city?.message}>
            <Input
              {...register('city')}
              type="text"
              placeholder="Enter city"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField label="Area" error={errors.area?.message}>
            <Input
              {...register('area')}
              type="text"
              placeholder="Enter area"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 2: Contact Details */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Contact Details
        </h3>

        <FormField label="Contact Person" error={errors.contactPerson?.message}>
          <Input
            {...register('contactPerson')}
            type="text"
            placeholder="Enter contact person name"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Phone" error={errors.phone?.message}>
            <Input
              {...register('phone')}
              type="tel"
              placeholder="Enter phone number"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter email address"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 3: Credit Terms */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Credit Terms
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Credit Limit (Rs.)"
            error={errors.creditLimit?.message}
            required
            helperText="Set to 0 for cash-only clients"
          >
            <Input
              {...register('creditLimit', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField
            label="Payment Terms (Days)"
            error={errors.paymentTermsDays?.message}
            required
            helperText="e.g., 7 for weekly, 30 for monthly"
          >
            <Input
              {...register('paymentTermsDays', { valueAsNumber: true })}
              type="number"
              placeholder="30"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 4: Status */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Status
        </h3>

        <FormField label="Client Status" error={errors.status?.message}>
          <RadioBadgeGroup
            name="status"
            value={status}
            onChange={(value) => {
              setStatus(value as 'ACTIVE' | 'INACTIVE');
              register('status').onChange({ target: { value } } as any);
            }}
            options={[
              { value: 'ACTIVE', label: 'Active', color: 'green' },
              { value: 'INACTIVE', label: 'Inactive', color: 'red' },
            ]}
            disabled={isLoading}
          />
          <input type="hidden" {...register('status')} value={status} />
        </FormField>
      </div>

      {/* Action Button - Sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-8 px-6 py-4">
        <div className="flex gap-3 max-w-md ml-auto">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            {client ? 'Update Client' : 'Save Client'}
          </Button>
        </div>
      </div>
    </form>
  );
};
