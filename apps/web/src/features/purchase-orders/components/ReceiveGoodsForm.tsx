import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, PackageCheck } from 'lucide-react';
import { Button, Combobox, FormField, Input } from '../../../components/ui';
import { PurchaseOrder, ReceiveGoodsRequest, ReceiveGoodsItem } from '../types/purchase-order.types';
import { useWarehousesForSelect } from '@/hooks/useWarehouses';

const receiveGoodsFormSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  receivedDate: z.string().optional(),
});

type ReceiveGoodsFormData = z.infer<typeof receiveGoodsFormSchema>;

interface ItemFormState {
  quantity: number;
  binLocation: string;
  batchNo: string;
}

interface ReceiveGoodsFormProps {
  purchaseOrder: PurchaseOrder;
  onSubmit: (data: ReceiveGoodsRequest) => Promise<void>;
  isLoading?: boolean;
}

/**
 * ReceiveGoodsForm - Form for receiving goods from a purchase order
 * Allows specifying warehouse, bin locations, and batch numbers for each item
 */
export const ReceiveGoodsForm: React.FC<ReceiveGoodsFormProps> = ({
  purchaseOrder,
  onSubmit,
  isLoading = false,
}) => {
  const { options: warehouseOptions, isLoading: warehousesLoading } = useWarehousesForSelect();

  // Initialize item form state for each PO item
  const [itemStates, setItemStates] = useState<Record<string, ItemFormState>>(() => {
    const initialStates: Record<string, ItemFormState> = {};
    purchaseOrder.items.forEach((item) => {
      const key = `${item.productId}-${item.productVariantId || 'null'}`;
      initialStates[key] = {
        quantity: item.quantity,
        binLocation: '',
        batchNo: '',
      };
    });
    return initialStates;
  });

  const [formError, setFormError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ReceiveGoodsFormData>({
    resolver: zodResolver(receiveGoodsFormSchema),
    defaultValues: {
      warehouseId: '',
      receivedDate: new Date().toISOString().split('T')[0],
    },
  });

  const warehouseId = watch('warehouseId');

  const updateItemState = (itemKey: string, field: keyof ItemFormState, value: string | number) => {
    setItemStates((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value,
      },
    }));
  };

  const handleFormSubmit = async (data: ReceiveGoodsFormData) => {
    setFormError('');

    // Validate that all items have valid quantities
    const items: ReceiveGoodsItem[] = [];
    let hasError = false;

    purchaseOrder.items.forEach((item) => {
      const key = `${item.productId}-${item.productVariantId || 'null'}`;
      const state = itemStates[key];

      if (state.quantity <= 0) {
        setFormError('All items must have a quantity greater than 0');
        hasError = true;
        return;
      }

      if (state.quantity > item.quantity) {
        setFormError(`Quantity for ${item.product?.name || 'item'} cannot exceed ordered quantity (${item.quantity})`);
        hasError = true;
        return;
      }

      items.push({
        productId: item.productId,
        productVariantId: item.productVariantId || null,
        quantity: state.quantity,
        binLocation: state.binLocation || null,
        batchNo: state.batchNo || null,
      });
    });

    if (hasError || items.length === 0) {
      return;
    }

    try {
      const payload: ReceiveGoodsRequest = {
        warehouseId: data.warehouseId,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
        items,
      };

      await onSubmit(payload);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Receipt Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Receipt Information
        </h3>

        {/* Form Error Alert */}
        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2 items-start">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Warehouse Selection */}
          <FormField label="Warehouse" error={errors.warehouseId?.message} required>
            <Combobox
              options={warehouseOptions}
              value={warehouseId}
              onChange={(value) => setValue('warehouseId', value || '')}
              placeholder="Select warehouse..."
              isLoading={warehousesLoading}
              disabled={isLoading}
            />
          </FormField>

          {/* Received Date */}
          <FormField label="Received Date" error={errors.receivedDate?.message}>
            <Input
              {...register('receivedDate')}
              type="date"
              disabled={isLoading}
              className="py-2.5"
            />
          </FormField>
        </div>
      </div>

      {/* SECTION 2: Purchase Order Details (Read-only) */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Purchase Order Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
            <p className="text-gray-900 font-mono font-semibold">{purchaseOrder.poNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <p className="text-gray-900">{purchaseOrder.supplier?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
            <p className="text-gray-900">
              {new Date(purchaseOrder.orderDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Items to Receive */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
          Items to Receive
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">Ordered Qty</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">Receive Qty</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Bin Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Batch No</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.items.map((item) => {
                const key = `${item.productId}-${item.productVariantId || 'null'}`;
                const state = itemStates[key];

                return (
                  <tr key={key} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-gray-500">{item.product?.sku || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-900 font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={state.quantity}
                        onChange={(e) =>
                          updateItemState(key, 'quantity', Math.max(0, Number(e.target.value)))
                        }
                        min="0"
                        max={item.quantity}
                        disabled={isLoading}
                        className="w-24 text-center py-2"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        value={state.binLocation}
                        onChange={(e) => updateItemState(key, 'binLocation', e.target.value)}
                        placeholder="e.g., A-01-05"
                        disabled={isLoading}
                        className="w-32 py-2"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        value={state.batchNo}
                        onChange={(e) => updateItemState(key, 'batchNo', e.target.value)}
                        placeholder="Optional"
                        disabled={isLoading}
                        className="w-32 py-2"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex gap-2 items-start">
          <PackageCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Receipt Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Adjust receive quantity if partial receipt</li>
              <li>Enter bin location for each item (optional but recommended)</li>
              <li>Batch number will be auto-generated if not provided</li>
              <li>Inventory will be updated automatically upon receipt</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons - Sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 -mb-8 px-6 py-4">
        <div className="flex gap-3 max-w-md ml-auto">
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={isLoading || !warehouseId}
            className="flex-1"
            icon={<PackageCheck size={20} />}
          >
            Receive Goods
          </Button>
        </div>
      </div>
    </form>
  );
};
