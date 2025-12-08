import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, AlertCircle, Trash2 } from 'lucide-react';
import { Button, Combobox, ComboboxOption, FormField, Input, RadioBadgeGroup } from '../../../components/ui';
import { PurchaseOrder, CreatePurchaseOrderRequest, CreatePOItemRequest } from '../types/purchase-order.types';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useVariantsByProduct } from '@/features/products/hooks/useVariants';
import { useUomsForSelect } from '@/hooks/useUoms';

const poFormSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedArrivalDate: z.string().optional(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED']).default('PENDING'),
  notes: z.string().optional(),
});

type POFormData = z.infer<typeof poFormSchema>;

interface POFormProps {
  onSubmit: (data: CreatePurchaseOrderRequest) => Promise<void>;
  purchaseOrder?: PurchaseOrder;
  isLoading?: boolean;
}

/**
 * POForm - Reusable purchase order form component
 * Can be used for both creating and editing purchase orders
 * Features searchable supplier and product dropdowns
 */
export const POForm: React.FC<POFormProps> = ({
  onSubmit,
  purchaseOrder,
  isLoading = false,
}) => {
  const [items, setItems] = useState<CreatePOItemRequest[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [itemError, setItemError] = useState<string>('');
  const [status, setStatus] = useState(purchaseOrder?.status || 'PENDING');

  // UOM Conversion state
  const [useConversion, setUseConversion] = useState<boolean>(false);
  const [orderUomId, setOrderUomId] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [conversionFactor, setConversionFactor] = useState<number>(0);

  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ limit: 100 });
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 100 });
  const { data: variantsData, isLoading: variantsLoading } = useVariantsByProduct(
    selectedProduct,
    'ACTIVE'
  );
  const { options: uomOptions, isLoading: uomsLoading } = useUomsForSelect();

  const suppliers = suppliersData?.data || [];
  const products = productsData?.data || [];
  const variants = variantsData?.data || [];

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const productHasVariants = selectedProductData?.hasVariants || false;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      supplierId: purchaseOrder?.supplierId || '',
      orderDate: purchaseOrder
        ? new Date(purchaseOrder.orderDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      expectedArrivalDate: purchaseOrder?.expectedArrivalDate
        ? new Date(purchaseOrder.expectedArrivalDate).toISOString().split('T')[0]
        : '',
      status: purchaseOrder?.status || 'PENDING',
      notes: purchaseOrder?.notes || '',
    },
  });

  const supplierId = watch('supplierId');

  useEffect(() => {
    if (purchaseOrder && purchaseOrder.items.length > 0) {
      setItems(
        purchaseOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        }))
      );
    }
  }, [purchaseOrder]);

  const supplierOptions: ComboboxOption[] = suppliers.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const productOptions: ComboboxOption[] = products.map((p) => ({
    value: p.id,
    label: `${p.sku} - ${p.name}`,
  }));

  const variantOptions: ComboboxOption[] = variants.map((v) => ({
    value: v.id,
    label: `${v.sku} - ${v.variantName}`,
  }));

  const handleAddItem = () => {
    setItemError('');

    if (!selectedProduct) {
      setItemError('Please select a product');
      return;
    }

    if (productHasVariants && !selectedVariant) {
      setItemError('Please select a product variant');
      return;
    }

    if (quantity <= 0) {
      setItemError('Quantity must be greater than 0');
      return;
    }

    if (unitCost <= 0) {
      setItemError('Unit cost must be greater than 0');
      return;
    }

    const newItem: CreatePOItemRequest = {
      productId: selectedProduct,
      productVariantId: selectedVariant || undefined,
      quantity,
      unitCost,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setSelectedVariant('');
    setQuantity(1);
    setUnitCost(0);

    // Reset conversion fields
    setUseConversion(false);
    setOrderUomId('');
    setOrderQuantity(0);
    setConversionFactor(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // UOM Conversion handlers
  const handleToggleConversion = (enabled: boolean) => {
    setUseConversion(enabled);
    if (!enabled) {
      // Reset conversion fields when disabled
      setOrderUomId('');
      setOrderQuantity(0);
      setConversionFactor(0);
      setQuantity(1);
    }
  };

  const handleOrderQuantityChange = (value: number) => {
    setOrderQuantity(value);
    // Calculate base quantity
    const factor = conversionFactor || 1;
    setQuantity(value * factor);
  };

  const handleConversionFactorChange = (value: number) => {
    setConversionFactor(value);
    // Recalculate base quantity
    const orderQty = orderQuantity || 0;
    setQuantity(orderQty * value);
  };

  const handleFormSubmit = async (data: POFormData) => {
    if (items.length === 0) {
      setItemError('Please add at least one item');
      return;
    }

    try {
      const payload: any = {
        supplierId: data.supplierId,
        orderDate: new Date(data.orderDate),
        expectedArrivalDate: data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : undefined,
        items,
        notes: data.notes,
      };

      // Include status when editing existing PO
      if (purchaseOrder) {
        payload.status = status;
      }

      await onSubmit(payload);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const calculateLineTotal = (qty: number, cost: number) => (qty * cost).toFixed(2);
  const calculateGrandTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Order Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Order Information
        </h3>

        {/* Supplier - Using Combobox for searchable dropdown */}
        <FormField label="Supplier" error={errors.supplierId?.message} required>
          <Combobox
            options={supplierOptions}
            value={supplierId}
            onChange={(value) => setValue('supplierId', value || '')}
            placeholder="Search and select supplier..."
            isLoading={suppliersLoading}
            disabled={isLoading || !!purchaseOrder}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Date */}
          <FormField label="Order Date" error={errors.orderDate?.message} required>
            <Input
              {...register('orderDate')}
              type="date"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>

          {/* Expected Arrival Date */}
          <FormField label="Expected Arrival Date" error={errors.expectedArrivalDate?.message}>
            <Input
              {...register('expectedArrivalDate')}
              type="date"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Add any notes about this purchase order..."
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg
              focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            disabled={isLoading}
          />
        </FormField>
      </div>

      {/* SECTION 2: Status */}
      {purchaseOrder && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Order Status
          </h3>

          <FormField label="Status" error={errors.status?.message}>
            <RadioBadgeGroup
              name="status"
              value={status}
              onChange={(value) => {
                setStatus(value as 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED');
                register('status').onChange({ target: { value } } as any);
              }}
              options={[
                { value: 'PENDING', label: 'Pending', color: 'blue' },
                { value: 'IN_TRANSIT', label: 'In Transit', color: 'yellow' },
                { value: 'RECEIVED', label: 'Received', color: 'green' },
                { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
              ]}
              disabled={isLoading}
            />
            <input type="hidden" {...register('status')} value={status} />
          </FormField>
        </div>
      )}

      {/* SECTION 3: Line Items */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Order Items
        </h3>

        {/* Item Error Alert */}
        {itemError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 items-start">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{itemError}</p>
          </div>
        )}

        {/* Add Item Form */}
        <div className="space-y-6 mb-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h4 className="font-semibold text-gray-900 text-base">Add New Item</h4>

          <FormField label="Product">
            <Combobox
              options={productOptions}
              value={selectedProduct}
              onChange={(value) => {
                setSelectedProduct(value || '');
                setSelectedVariant('');
              }}
              placeholder="Search products..."
              disabled={!supplierId || productsLoading || isLoading}
              isLoading={productsLoading}
            />
          </FormField>

          {productHasVariants && (
            <FormField label="Product Variant" required>
              <Combobox
                options={variantOptions}
                value={selectedVariant}
                onChange={(value) => setSelectedVariant(value || '')}
                placeholder={variantsLoading ? 'Loading variants...' : 'Select a variant...'}
                disabled={!selectedProduct || variantsLoading || isLoading}
                isLoading={variantsLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                This product has variants. Please select one to continue.
              </p>
            </FormField>
          )}

          {/* Product Base UOM Display */}
          {selectedProductData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Base UOM:</span>{' '}
                {selectedProductData.uom?.name || 'Not Set'}{' '}
                {selectedProductData.uom?.abbreviation && (
                  <span className="text-gray-500">({selectedProductData.uom.abbreviation})</span>
                )}
              </p>
            </div>
          )}

          {/* UOM Conversion Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useConversion"
              checked={useConversion}
              onChange={(e) => handleToggleConversion(e.target.checked)}
              disabled={isLoading || !selectedProduct}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="useConversion" className="text-sm font-medium text-gray-700">
              Order in different UOM (with conversion)
            </label>
          </div>

          {/* Conversion Fields */}
          {useConversion ? (
            <div className="space-y-4 p-4 bg-gray-100 border-2 border-gray-300 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Order UOM Selector */}
                <FormField label="Order UOM" required>
                  <Combobox
                    options={uomOptions}
                    value={orderUomId}
                    onChange={(value) => setOrderUomId(value || '')}
                    placeholder="Select UOM..."
                    disabled={isLoading || uomsLoading}
                    isLoading={uomsLoading}
                  />
                </FormField>

                {/* Order Quantity */}
                <FormField label="Quantity" required>
                  <Input
                    type="number"
                    value={orderQuantity || ''}
                    onChange={(e) => handleOrderQuantityChange(Math.max(0, Number(e.target.value)))}
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                    className="py-2.5"
                    placeholder="e.g., 5"
                  />
                </FormField>

                {/* Conversion Factor */}
                <FormField
                  label={`Each contains (${selectedProductData?.uom?.abbreviation || 'base units'})`}
                  required
                >
                  <Input
                    type="number"
                    value={conversionFactor || ''}
                    onChange={(e) => handleConversionFactorChange(Math.max(0, Number(e.target.value)))}
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                    className="py-2.5"
                    placeholder="e.g., 24"
                  />
                </FormField>
              </div>

              {/* Calculated Base Quantity Display */}
              <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-md">
                <p className="text-sm font-semibold text-blue-900">
                  = {quantity} {selectedProductData?.uom?.name || 'units'} total
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ({orderQuantity} × {conversionFactor} = {quantity})
                </p>
              </div>
            </div>
          ) : (
            /* Direct Entry in Base UOM */
            <FormField label={`Quantity (${selectedProductData?.uom?.name || 'units'})`} required>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                min="1"
                disabled={isLoading}
                className="py-2.5"
              />
            </FormField>
          )}

          {/* Unit Cost and Line Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField
              label={useConversion && orderUomId
                ? `Unit Cost (per ${uomOptions.find(u => u.value === orderUomId)?.label || 'unit'})`
                : `Unit Cost (per ${selectedProductData?.uom?.name || 'unit'})`
              }
              required
            >
              <Input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                min="0"
                step="0.01"
                disabled={isLoading}
                className="py-2.5"
              />
            </FormField>

            <FormField label="Line Total">
              <Input
                type="text"
                value={useConversion
                  ? calculateLineTotal(orderQuantity, unitCost)
                  : calculateLineTotal(quantity, unitCost)
                }
                disabled
                className="bg-gray-100 py-2.5 font-semibold"
              />
            </FormField>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleAddItem}
            disabled={isLoading || !supplierId}
            icon={<Plus size={20} />}
          >
            Add Item
          </Button>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-gray-300">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">Product</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-900">Quantity</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-900">Unit Cost</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-900">Total</th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const product = products.find((p) => p.id === item.productId);
                  const variant = item.productVariantId
                    ? variants.find((v) => v.id === item.productVariantId)
                    : null;

                  let displayName = 'Unknown';
                  if (product) {
                    displayName = `${product.sku} - ${product.name}`;
                    if (variant) {
                      displayName = `${variant.sku} - ${product.name} (${variant.variantName})`;
                    }
                  }

                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="px-4 py-2 text-gray-900">{displayName}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">
                        ${calculateLineTotal(item.quantity, item.unitCost)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={isLoading}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Grand Total */}
            <div className="mt-4 p-4 bg-white border border-gray-300 rounded-md flex justify-end">
              <div className="text-lg font-semibold text-gray-900">
                Grand Total: <span className="text-blue-600">${calculateGrandTotal()}</span>
              </div>
            </div>
          </div>
        )}
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
            {purchaseOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </div>
      </div>
    </form>
  );
};
