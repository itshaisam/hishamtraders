import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, FormField, RadioBadgeGroup, Combobox } from '../../../components/ui';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../types/supplier.types';
import { useCountriesForSelect } from '../../../hooks/useCountries';
import { usePaymentTermsForSelect } from '../../../hooks/usePaymentTerms';

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').min(2, 'Name must be at least 2 characters'),
  countryId: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTermId: z.string().optional(),
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
  const [status, setStatus] = useState(supplier?.status || 'ACTIVE');
  const { options: countryOptions, isLoading: isCountriesLoading } = useCountriesForSelect();
  const { options: paymentTermOptions, isLoading: isPaymentTermsLoading } = usePaymentTermsForSelect();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplier || {
      status: 'ACTIVE',
    },
  });

  const countryIdValue = watch('countryId');
  const paymentTermIdValue = watch('paymentTermId');

  useEffect(() => {
    if (supplier) {
      reset(supplier);
      setStatus(supplier.status);
    } else {
      reset({ status: 'ACTIVE' });
      setStatus('ACTIVE');
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Basic Information
        </h3>

        <FormField label="Supplier Name" error={errors.name?.message} required>
          <Input
            {...register('name')}
            type="text"
            placeholder="Enter supplier name"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>

        <FormField label="Country" error={errors.countryId?.message}>
          <Combobox
            options={countryOptions}
            value={countryIdValue || ''}
            onChange={(value) => setValue('countryId', value || undefined)}
            placeholder="Select a country"
            disabled={isLoading || isCountriesLoading}
            searchable
          />
        </FormField>
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

        <FormField label="Email" error={errors.email?.message}>
          <Input
            {...register('email')}
            type="email"
            placeholder="Enter email address"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>

        <FormField label="Phone" error={errors.phone?.message}>
          <Input
            {...register('phone')}
            type="tel"
            placeholder="Enter phone number"
            disabled={isLoading}
            className="py-2.5"
          />
        </FormField>
      </div>

      {/* SECTION 3: Additional Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Additional Information
        </h3>

        <FormField label="Address" error={errors.address?.message}>
          <textarea
            {...register('address')}
            rows={3}
            placeholder="Enter supplier address"
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg
              focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Payment Terms" error={errors.paymentTermId?.message}>
          <Combobox
            options={paymentTermOptions}
            value={paymentTermIdValue || ''}
            onChange={(value) => setValue('paymentTermId', value || undefined)}
            placeholder="Select payment terms"
            disabled={isLoading || isPaymentTermsLoading}
            searchable
          />
        </FormField>
      </div>

      {/* SECTION 4: Status */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Status
        </h3>

        <FormField label="Supplier Status" error={errors.status?.message}>
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
            {supplier ? 'Update Supplier' : 'Save Supplier'}
          </Button>
        </div>
      </div>
    </form>
  );
};
