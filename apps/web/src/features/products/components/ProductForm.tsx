import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Input, FormField, RadioBadgeGroup, Combobox } from '../../../components/ui';
import { Product, CreateProductRequest, UpdateProductRequest } from '../types/product.types';
import { useBrandsForSelect, useCreateBrand, CreateBrandRequest } from '../../../hooks/useBrands';
import { useCategoriesForSelect, useCreateCategory, CreateCategoryRequest } from '../../../hooks/useCategories';
import { useUomsForSelect, useCreateUom, CreateUomRequest } from '../../../hooks/useUoms';

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(2, 'Name must be at least 2 characters'),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  uomId: z.string().optional(),
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

  // Inline creation state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showUomForm, setShowUomForm] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [newUomName, setNewUomName] = useState('');
  const [newUomAbbr, setNewUomAbbr] = useState('');
  const [newUomDesc, setNewUomDesc] = useState('');

  const { options: brandOptions, isLoading: isBrandsLoading } = useBrandsForSelect();
  const { options: categoryOptions, isLoading: isCategoriesLoading } = useCategoriesForSelect();
  const { options: uomOptions, isLoading: isUomsLoading } = useUomsForSelect();

  const createCategory = useCreateCategory();
  const createBrand = useCreateBrand();
  const createUom = useCreateUom();

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
  const uomIdValue = watch('uomId');

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const newCategory = await createCategory.mutateAsync({
        name: newCategoryName,
        description: newCategoryDesc || undefined,
      });
      setValue('categoryId', newCategory.id);
      setShowCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error('Brand name is required');
      return;
    }

    try {
      const newBrand = await createBrand.mutateAsync({
        name: newBrandName,
        country: newBrandCountry || undefined,
      });
      setValue('brandId', newBrand.id);
      setShowBrandForm(false);
      setNewBrandName('');
      setNewBrandCountry('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateUom = async () => {
    if (!newUomName.trim() || !newUomAbbr.trim()) {
      toast.error('UOM name and abbreviation are required');
      return;
    }

    try {
      const newUom = await createUom.mutateAsync({
        name: newUomName,
        abbreviation: newUomAbbr,
        description: newUomDesc || undefined,
      });
      setValue('uomId', newUom.id);
      setShowUomForm(false);
      setNewUomName('');
      setNewUomAbbr('');
      setNewUomDesc('');
    } catch (error) {
      // Error handled by mutation
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
          <FormField label="Product Name" error={errors.name?.message} required>
            <Input
              {...register('name')}
              type="text"
              placeholder="e.g., Stainless Steel Sink"
              disabled={isLoading || !!product}
              className="py-2.5"
            />
            {product && (
              <p className="text-xs text-gray-500 mt-1">
                Product name cannot be changed after creation
              </p>
            )}
          </FormField>

          <FormField label="SKU (System Generated)" required={false}>
            <Input
              type="text"
              placeholder="Auto-generated as PROD-YYYY-XXX"
              disabled
              value={product?.sku || 'Will be generated on save'}
              className="py-2.5 bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">SKU is automatically generated by the system</p>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand Field with Inline Creation */}
          <div>
            <FormField label="Brand" error={errors.brandId?.message}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    options={brandOptions}
                    value={brandIdValue || ''}
                    onChange={(value) => setValue('brandId', value || undefined)}
                    placeholder="Select a brand"
                    disabled={isLoading || isBrandsLoading}
                    searchable
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBrandForm(!showBrandForm)}
                  disabled={isLoading}
                  title="Add new brand"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormField>

            {/* Inline Brand Creation Form */}
            {showBrandForm && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-900">Add New Brand</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBrandForm(false);
                      setNewBrandName('');
                      setNewBrandCountry('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g., EliteFaucet"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Country (Optional)
                  </label>
                  <Input
                    type="text"
                    value={newBrandCountry}
                    onChange={(e) => setNewBrandCountry(e.target.value)}
                    placeholder="e.g., China"
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCreateBrand}
                    disabled={createBrand.isPending}
                    className="flex-1"
                  >
                    {createBrand.isPending ? 'Creating...' : 'Create Brand'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowBrandForm(false);
                      setNewBrandName('');
                      setNewBrandCountry('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Field with Inline Creation */}
          <div>
            <FormField label="Category" error={errors.categoryId?.message}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    options={categoryOptions}
                    value={categoryIdValue || ''}
                    onChange={(value) => setValue('categoryId', value || undefined)}
                    placeholder="Select a category"
                    disabled={isLoading || isCategoriesLoading}
                    searchable
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  disabled={isLoading}
                  title="Add new category"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormField>

            {/* Inline Category Creation Form */}
            {showCategoryForm && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-900">Add New Category</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setNewCategoryName('');
                      setNewCategoryDesc('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Sinks"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <Input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Brief description"
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={createCategory.isPending}
                    className="flex-1"
                  >
                    {createCategory.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setNewCategoryName('');
                      setNewCategoryDesc('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* UOM Field with Inline Creation */}
          <div>
            <FormField label="Unit of Measure" error={errors.uomId?.message}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    options={uomOptions}
                    value={uomIdValue || ''}
                    onChange={(value) => setValue('uomId', value || undefined)}
                    placeholder="Select a UOM"
                    disabled={isLoading || isUomsLoading}
                    searchable
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUomForm(!showUomForm)}
                  disabled={isLoading}
                  title="Add new UOM"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormField>

            {/* Inline UOM Creation Form */}
            {showUomForm && (
              <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-900">Add New UOM</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUomForm(false);
                      setNewUomName('');
                      setNewUomAbbr('');
                      setNewUomDesc('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    UOM Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newUomName}
                    onChange={(e) => setNewUomName(e.target.value)}
                    placeholder="e.g., Piece"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Abbreviation <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newUomAbbr}
                    onChange={(e) => setNewUomAbbr(e.target.value)}
                    placeholder="e.g., pc"
                    maxLength={10}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <Input
                    type="text"
                    value={newUomDesc}
                    onChange={(e) => setNewUomDesc(e.target.value)}
                    placeholder="Brief description"
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCreateUom}
                    disabled={createUom.isPending}
                    className="flex-1"
                  >
                    {createUom.isPending ? 'Creating...' : 'Create UOM'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowUomForm(false);
                      setNewUomName('');
                      setNewUomAbbr('');
                      setNewUomDesc('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
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
