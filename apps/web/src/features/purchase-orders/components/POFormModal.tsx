import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, AlertCircle } from 'lucide-react';
import { PurchaseOrder, CreatePurchaseOrderRequest, CreatePOItemRequest } from '../types/purchase-order.types';
import { POItemsTable } from './POItemsTable';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCurrencySymbol } from '../../../hooks/useSettings';

const poFormSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedArrivalDate: z.string().optional(),
  notes: z.string().optional(),
});

type POFormData = z.infer<typeof poFormSchema>;

interface POFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderRequest) => Promise<void>;
  purchaseOrder?: PurchaseOrder;
  isLoading?: boolean;
}

export const POFormModal: React.FC<POFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  purchaseOrder,
  isLoading = false,
}) => {
  const [items, setItems] = useState<CreatePOItemRequest[]>([]);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [itemError, setItemError] = useState<string>('');

  const { data: suppliersData } = useSuppliers({ limit: 100 });
  const { data: productsData } = useProducts({ limit: 100 });

  const suppliers = suppliersData?.data || [];
  const products = productsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      supplierId: purchaseOrder?.supplierId || '',
      orderDate: purchaseOrder ? new Date(purchaseOrder.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedArrivalDate: purchaseOrder?.expectedArrivalDate ? new Date(purchaseOrder.expectedArrivalDate).toISOString().split('T')[0] : '',
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

  const handleAddItem = () => {
    setItemError('');

    if (!selectedProduct) {
      setItemError('Please select a product');
      return;
    }

    if (quantity <= 0) {
      setItemError('Quantity must be greater than 0');
      return;
    }

    if (unitCost < 0) {
      setItemError('Unit cost must be greater than or equal to 0');
      return;
    }

    const newItem: CreatePOItemRequest = {
      productId: selectedProduct,
      quantity,
      unitCost,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity(1);
    setUnitCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: POFormData) => {
    if (items.length === 0) {
      setItemError('At least one item is required');
      return;
    }

    try {
      const submitData: CreatePurchaseOrderRequest = {
        supplierId: data.supplierId,
        orderDate: new Date(data.orderDate),
        expectedArrivalDate: data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : undefined,
        items,
        notes: data.notes,
      };

      await onSubmit(submitData);
      reset();
      setItems([]);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  if (!isOpen) return null;

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">
            {purchaseOrder ? 'View Purchase Order' : 'Create Purchase Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Supplier and Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                {...register('supplierId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                disabled={isLoading || !!purchaseOrder}
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierId.message}</p>
              )}
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date *
              </label>
              <input
                {...register('orderDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                disabled={isLoading || !!purchaseOrder}
              />
              {errors.orderDate && (
                <p className="mt-1 text-sm text-red-600">{errors.orderDate.message}</p>
              )}
            </div>

            {/* Expected Arrival Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Arrival Date
              </label>
              <input
                {...register('expectedArrivalDate')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                disabled={isLoading}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                disabled={isLoading}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchase Order Items
            </h3>

            {/* Add Item Section */}
            {!purchaseOrder && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Product Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        const product = products.find((p) => p.id === e.target.value);
                        if (product) {
                          setUnitCost(Number(product.costPrice));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading || !supplierId}
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Unit Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Cost
                    </label>
                    <input
                      type="number"
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Add Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={isLoading || !supplierId}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  </div>
                </div>

                {itemError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {itemError}
                  </div>
                )}

                {selectedProductData && (
                  <div className="text-sm text-gray-600">
                    <p>Selected: <span className="font-semibold">{selectedProductData.name}</span></p>
                    <p>Line Total: <span className="font-semibold">{cs} {(quantity * unitCost).toFixed(2)}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <POItemsTable
              items={items.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                return {
                  id: `item-${idx}`,
                  poId: '',
                  productId: item.productId,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  totalCost: item.quantity * item.unitCost,
                  product: product ? {
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    costPrice: Number(product.costPrice),
                    sellingPrice: Number(product.sellingPrice),
                  } : undefined,
                };
              })}
              onRemoveItem={!purchaseOrder ? handleRemoveItem : undefined}
              readonly={!!purchaseOrder}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {purchaseOrder ? 'Close' : 'Cancel'}
            </button>
            {!purchaseOrder && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create PO'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
