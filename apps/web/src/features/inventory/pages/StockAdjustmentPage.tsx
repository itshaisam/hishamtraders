import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageMinus, PackagePlus, Loader2 } from 'lucide-react';
import { useCreateAdjustment } from '@/hooks/useStockAdjustments';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useWarehousesForSelect } from '@/hooks/useWarehouses';
import { Breadcrumbs } from '@/components/ui';
import { AdjustmentType, CreateAdjustmentDto } from '@/types/stock-adjustment.types';
import toast from 'react-hot-toast';

export const StockAdjustmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createAdjustment, isPending } = useCreateAdjustment();
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });
  const { options: warehouseOptions } = useWarehousesForSelect();

  const [formData, setFormData] = useState<CreateAdjustmentDto>({
    productId: '',
    productVariantId: null,
    warehouseId: '',
    adjustmentType: 'CORRECTION',
    quantity: 0,
    reason: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.productId) newErrors.productId = 'Product is required';
    if (!formData.warehouseId) newErrors.warehouseId = 'Warehouse is required';
    if (formData.quantity === 0) newErrors.quantity = 'Quantity cannot be zero';
    if (formData.reason.length < 10) newErrors.reason = 'Reason must be at least 10 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createAdjustment(formData, {
      onSuccess: (response) => {
        toast.success(response.message || 'Stock adjustment created and pending approval');
        navigate('/inventory/adjustments/history');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create stock adjustment');
      },
    });
  };

  const adjustmentTypes: { value: AdjustmentType; label: string; icon: React.ReactNode }[] = [
    { value: 'WASTAGE', label: 'Wastage', icon: <PackageMinus size={16} /> },
    { value: 'DAMAGE', label: 'Damage', icon: <PackageMinus size={16} /> },
    { value: 'THEFT', label: 'Theft', icon: <PackageMinus size={16} /> },
    { value: 'CORRECTION', label: 'Correction', icon: <PackagePlus size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Stock Adjustment' },
          ]}
        />

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Stock Adjustment</h1>
          <p className="mt-2 text-gray-600">
            Record stock adjustments for wastage, damage, theft, or corrections
          </p>
          <p className="mt-1 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md">
            ⚠️ Note: Adjustments require admin approval before inventory is updated
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.productId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a product</option>
              {productsData?.data.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
            {errors.productId && <p className="mt-1 text-sm text-red-500">{errors.productId}</p>}
          </div>

          {/* Warehouse Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.warehouseId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a warehouse</option>
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </option>
              ))}
            </select>
            {errors.warehouseId && (
              <p className="mt-1 text-sm text-red-500">{errors.warehouseId}</p>
            )}
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {adjustmentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, adjustmentType: type.value })}
                  className={`px-4 py-3 border-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    formData.adjustmentType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter quantity (positive for increase, negative for decrease)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use positive numbers to increase stock, negative numbers to decrease
            </p>
            {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Explain the reason for this adjustment (minimum 10 characters)"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.reason.length}/10 characters minimum
            </p>
            {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={20} className="animate-spin" />}
              Submit for Approval
            </button>
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
