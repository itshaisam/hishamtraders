import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Edit, Trash2, X, History } from 'lucide-react';
import { ProductForm } from '../components/ProductForm';
import { AttributeBuilder } from '../components/AttributeBuilder';
import { useProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { useVariantsByProduct, useDeleteVariant, useCreateVariant, useUpdateVariant } from '../hooks/useVariants';
import { Button, Breadcrumbs, Input, FormField } from '../../../components/ui';
import { ChangeHistoryModal } from '../../../components/ChangeHistoryModal';
import { ProductVariant, CreateVariantDto } from '../types/variant.types';

const variantSchema = z.object({
  variantName: z.string().min(1, 'Variant name is required').min(2, 'Name must be at least 2 characters'),
  sku: z.string().optional(),
  attributes: z.record(z.string(), z.string()).refine(
    (attrs) => Object.keys(attrs).length > 0,
    { message: 'At least one attribute is required' }
  ),
  costPrice: z.string().min(1, 'Cost price is required'),
  sellingPrice: z.string().min(1, 'Selling price is required'),
  reorderLevel: z.string().optional(),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

type VariantFormData = z.infer<typeof variantSchema>;

/**
 * ProductDetailPage - Full page for editing an existing product
 * Replaces the modal from the old UI
 */
export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: response, isLoading, isError } = useProduct(id || '');
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { data: variantsResponse, isLoading: variantsLoading } = useVariantsByProduct(id || '', 'ACTIVE');
  const { mutate: deleteVariant } = useDeleteVariant();
  const createVariant = useCreateVariant();
  const updateVariantMutation = useUpdateVariant();

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);

  // Extract product data from API response
  const product = response?.data;
  const variants = variantsResponse?.data || [];

  const {
    register,
    handleSubmit: handleVariantFormSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      variantName: '',
      sku: '',
      attributes: { attribute1: '' },
      costPrice: '',
      sellingPrice: '',
      reorderLevel: '10',
      binLocation: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (editingVariant) {
      reset({
        variantName: editingVariant.variantName,
        sku: editingVariant.sku,
        attributes: editingVariant.attributes,
        costPrice: editingVariant.costPrice.toString(),
        sellingPrice: editingVariant.sellingPrice.toString(),
        reorderLevel: editingVariant.reorderLevel.toString(),
        binLocation: editingVariant.binLocation || '',
        status: editingVariant.status,
      });
    } else {
      reset({
        variantName: '',
        sku: '',
        attributes: { attribute1: '' },
        costPrice: '',
        sellingPrice: '',
        reorderLevel: '10',
        binLocation: '',
        status: 'ACTIVE',
      });
    }
  }, [editingVariant, reset]);

  const handleSubmit = async (data: unknown) => {
    if (!id) return;
    updateProduct(
      { id, data: data as { [key: string]: unknown } },
      {
        onSuccess: () => {
          navigate('/products');
        },
      }
    );
  };

  const handleAddVariant = () => {
    setEditingVariant(undefined);
    setShowVariantForm(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setShowVariantForm(true);
  };

  const handleCancelVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariant(undefined);
    reset();
  };

  const handleDeleteVariant = (variantId: string) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      deleteVariant(variantId);
    }
  };

  const onSubmitVariant = async (data: VariantFormData) => {
    if (!id) return;

    try {
      if (editingVariant) {
        await updateVariantMutation.mutateAsync({
          id: editingVariant.id,
          data: {
            variantName: data.variantName,
            attributes: data.attributes,
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
            reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : undefined,
            binLocation: data.binLocation || undefined,
            status: data.status,
          },
        });
      } else {
        const createDto: CreateVariantDto = {
          productId: id,
          variantName: data.variantName,
          sku: data.sku || undefined,
          attributes: data.attributes,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          reorderLevel: data.reorderLevel ? parseInt(data.reorderLevel) : undefined,
          binLocation: data.binLocation || undefined,
          status: data.status,
        };
        await createVariant.mutateAsync(createDto);
      }
      handleCancelVariantForm();
    } catch (error) {
      console.error('Failed to save variant:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Product Not Found</h2>
            <p className="text-red-700 mb-4">The product you're looking for doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* Breadcrumbs - Responsive */}
        <Breadcrumbs
          items={[
            { label: 'Products', href: '/products' },
            { label: product.name },
          ]}
          className="text-xs sm:text-sm"
        />

        {/* Header with back button - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to products"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Update product information and details</p>
          </div>
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
            <History size={16} />
            History
          </button>
        </div>

        {/* Form Card - Full width on mobile, wider on desktop */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
          <ProductForm product={product} onSubmit={handleSubmit} isLoading={isUpdating} />
        </div>

        {/* Variants Section */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Product Variants</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage different variations of this product (e.g., colors, sizes, finishes)
              </p>
            </div>
            {!showVariantForm && (
              <Button variant="primary" onClick={handleAddVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            )}
          </div>

          {/* Inline Variant Form */}
          {showVariantForm && (
            <div className="mb-8 p-6 bg-gray-50 border-2 border-blue-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                </h3>
                <button
                  onClick={handleCancelVariantForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleVariantFormSubmit(onSubmitVariant)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('variantName')}
                    type="text"
                    placeholder="e.g., Chrome Finish"
                    className="w-full"
                  />
                  {errors.variantName && (
                    <p className="text-sm text-red-600 mt-1">{errors.variantName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (Optional - Auto-generated if empty)
                  </label>
                  <Input
                    {...register('sku')}
                    type="text"
                    placeholder="e.g., PROD-2025-001-CHR"
                    disabled={!!editingVariant}
                    className="w-full"
                  />
                  {editingVariant && (
                    <p className="text-xs text-gray-500 mt-1">SKU cannot be changed after creation</p>
                  )}
                </div>

                <Controller
                  name="attributes"
                  control={control}
                  render={({ field }) => (
                    <AttributeBuilder
                      attributes={field.value}
                      onChange={field.onChange}
                      error={errors.attributes?.message as string | undefined}
                    />
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('costPrice')}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full"
                    />
                    {errors.costPrice && (
                      <p className="text-sm text-red-600 mt-1">{errors.costPrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('sellingPrice')}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full"
                    />
                    {errors.sellingPrice && (
                      <p className="text-sm text-red-600 mt-1">{errors.sellingPrice.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <Input
                      {...register('reorderLevel')}
                      type="number"
                      placeholder="10"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bin Location
                    </label>
                    <Input
                      {...register('binLocation')}
                      type="text"
                      placeholder="e.g., A-12-3"
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="secondary" onClick={handleCancelVariantForm}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingVariant ? 'Update Variant' : 'Create Variant'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Variants Table */}
          {variantsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading variants...</p>
            </div>
          ) : variants.length === 0 && !showVariantForm ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No variants created yet</p>
              <Button variant="primary" onClick={handleAddVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Variant
              </Button>
            </div>
          ) : variants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variant Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attributes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selling Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {variant.sku}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {variant.variantName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {cs} {variant.costPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {cs} {variant.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            variant.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {variant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditVariant(variant)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit variant"
                            disabled={showVariantForm}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete variant"
                            disabled={showVariantForm}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {id && (
        <ChangeHistoryModal
          entityType="PRODUCT"
          entityId={id}
          currentData={product as any}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
