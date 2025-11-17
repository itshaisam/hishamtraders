import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, FormField } from '../../../components/ui';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/supplier.types';

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').min(2, 'Name must be at least 2 characters'),
  country: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
  onSubmit: (data: CreateSupplierRequest | UpdateSupplierRequest) => Promise<void>;
  supplier?: Supplier;
  isLoading?: boolean;
}

/**
 * SupplierForm - Reusable supplier form component
 * Can be used for both creating and editing suppliers
 */
export const SupplierForm: React.FC<SupplierFormProps> = ({
  onSubmit,
  supplier,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplier || {
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset(supplier);
    } else {
      reset({ status: 'ACTIVE' });
    }
  }, [supplier, reset]);

  const handleFormSubmit = async (data: SupplierFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error is handled by parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name */}
      <FormField label="Supplier Name" error={errors.name?.message} required>
        <Input
          {...register('name')}
          type="text"
          placeholder="Enter supplier name"
          disabled={isLoading}
        />
      </FormField>

      {/* Country */}
      <FormField label="Country" error={errors.country?.message}>
        <Input
          {...register('country')}
          type="text"
          placeholder="Enter country"
          disabled={isLoading}
        />
      </FormField>

      {/* Contact Person */}
      <FormField label="Contact Person" error={errors.contactPerson?.message}>
        <Input
          {...register('contactPerson')}
          type="text"
          placeholder="Enter contact person name"
          disabled={isLoading}
        />
      </FormField>

      {/* Email */}
      <FormField label="Email" error={errors.email?.message}>
        <Input
          {...register('email')}
          type="email"
          placeholder="Enter email address"
          disabled={isLoading}
        />
      </FormField>

      {/* Phone */}
      <FormField label="Phone" error={errors.phone?.message}>
        <Input
          {...register('phone')}
          type="tel"
          placeholder="Enter phone number"
          disabled={isLoading}
        />
      </FormField>

      {/* Address */}
      <FormField label="Address" error={errors.address?.message}>
        <textarea
          {...register('address')}
          rows={3}
          placeholder="Enter supplier address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-blue-600 focus:ring-blue-600
            disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
      </FormField>

      {/* Payment Terms */}
      <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
        <textarea
          {...register('paymentTerms')}
          rows={2}
          placeholder="e.g., Net 30, 50% advance + 50% on delivery"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-blue-600 focus:ring-blue-600
            disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
      </FormField>

      {/* Status */}
      <FormField label="Status" error={errors.status?.message}>
        <select
          {...register('status')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-blue-600 focus:ring-blue-600
            disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </FormField>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={isLoading}
        >
          {supplier ? 'Update Supplier' : 'Create Supplier'}
        </Button>
      </div>
    </form>
  );
};
