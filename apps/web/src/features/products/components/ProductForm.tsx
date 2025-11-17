import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, FormField, RadioBadgeGroup, Combobox } from '../../../components/ui';
import { Product, CreateProductRequest, UpdateProductRequest } from '../types/product.types';
import { useBrandsForSelect } from '../../../hooks/useBrands';
import { useCategoriesForSelect } from '../../../hooks/useCategories';

export const productFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required').toUpperCase(),
  name: z.string().min(1, 'Product name is required').min(2, 'Name must be at least 2 characters'),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Cost price must be positive')),
  sellingPrice: z.string().or(z.number()).pipe(z.coerce.number().positive('Selling price must be positive')),
  reorderLevel: z.string().or(z.number()).pipe(z.coerce.number().int().default(10)),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  product?: Product;
  isLoading?: boolean;
}

/**
 * ProductForm - Reusable product form component
 * Can be used for both creating and editing products
 */
export const ProductForm: React.FC<ProductFormProps> = ({
  onSubmit,
  product,
  isLoading = false,
}) => {
  const [status, setStatus] = useState(product?.status || 'ACTIVE');
  const { options: brandOptions, isLoading: isBrandsLoading } = useBrandsForSelect();
  const { options: categoryOptions, isLoading: isCategoriesLoading } = useCategoriesForSelect();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product || {
      status: 'ACTIVE',
      reorderLevel: 10,
    },
  });

  const brandIdValue = watch('brandId');
  const categoryIdValue = watch('categoryId');

  useEffect(() => {
    if (product) {
      reset(product);
      setStatus(product.status);
    } else {
      reset({ status: 'ACTIVE', reorderLevel: 10 });
      setStatus('ACTIVE');
    }
  }, [product, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="SKU" error={errors.sku?.message} required>
            <Input
              {...register('sku')}
              type="text"
              placeholder="e.g., PROD001"
              disabled={isLoading || !!product}
              className="py-2.5"
            />
          </FormField>

          <FormField label="Product Name" error={errors.name?.message} required>
            <Input
              {...register('name')}
              type="text"
              placeholder="e.g., Stainless Steel Sink"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Brand" error={errors.brandId?.message}>
            <Combobox
              options={brandOptions}
              value={brandIdValue || ''}
              onChange={(value) => setValue('brandId', value || undefined)}
              placeholder="Select a brand"
              disabled={isLoading || isBrandsLoading}
              searchable
            />
          </FormField>

          <FormField label="Category" error={errors.categoryId?.message}>
            <Combobox
              options={categoryOptions}
              value={categoryIdValue || ''}
              onChange={(value) => setValue('categoryId', value || undefined)}
              placeholder="Select a category"
              disabled={isLoading || isCategoriesLoading}
              searchable
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 2: Pricing Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Pricing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Cost Price" error={errors.costPrice?.message} required>
            <Input
              {...register('costPrice')}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField label="Selling Price" error={errors.sellingPrice?.message} required>
            <Input
              {...register('sellingPrice')}
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 3: Inventory Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Inventory
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Reorder Level" error={errors.reorderLevel?.message}>
            <Input
              {...register('reorderLevel')}
              type="number"
              placeholder="10"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          <FormField label="Bin Location" error={errors.binLocation?.message}>
            <Input
              {...register('binLocation')}
              type="text"
              placeholder="e.g., A-1-1"
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

        <FormField label="Product Status" error={errors.status?.message}>
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
            {product ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </div>
    </form>
  );
};
