import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Save, ArrowLeft, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { Spinner } from '../../../components/ui';
import { useCreateDeliveryNote } from '../../../hooks/useDeliveryNotes';
import { useClients } from '../../../hooks/useClients';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { useProducts } from '../../products/hooks/useProducts';
import { salesOrderService } from '../../../services/salesOrderService';
import { inventoryService } from '../../../services/inventoryService';
import toast from 'react-hot-toast';

const dnItemSchema = z.object({
  salesOrderItemId: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  productVariantId: z.string().nullable().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  maxQuantity: z.number().optional(), // for SO-linked items
});

const createDNFormSchema = z.object({
  salesOrderId: z.string().optional(),
  clientId: z.string().min(1, 'Customer is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  deliveryAddress: z.string().optional(),
  driverName: z.string().optional(),
  vehicleNo: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(dnItemSchema).min(1, 'At least one item is required'),
});

type DNFormData = z.infer<typeof createDNFormSchema>;

export const CreateDeliveryNotePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const salesOrderId = searchParams.get('salesOrderId');
  const createDN = useCreateDeliveryNote();
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });

  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});
  const [loadingSO, setLoadingSO] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DNFormData>({
    resolver: zodResolver(createDNFormSchema),
    defaultValues: {
      items: [{ productId: '', productVariantId: null, quantity: 1 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });

  const watchItems = watch('items');
  const watchWarehouseId = watch('warehouseId');

  // Pre-fill from Sales Order
  useEffect(() => {
    if (!salesOrderId) return;
    setLoadingSO(true);
    salesOrderService.getDeliverableItems(salesOrderId)
      .then((data: any) => {
        setValue('salesOrderId', salesOrderId);
        setValue('clientId', data.clientId);
        setValue('warehouseId', data.warehouseId);

        const items = data.items.map((item: any) => ({
          salesOrderItemId: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          quantity: item.remainingQuantity,
          maxQuantity: item.remainingQuantity,
        }));
        if (items.length > 0) replace(items);
      })
      .catch(() => {
        toast.error('Failed to load Sales Order items');
      })
      .finally(() => setLoadingSO(false));
  }, [salesOrderId]);

  // Fetch stock levels
  useEffect(() => {
    const fetchStockLevels = async () => {
      if (!watchWarehouseId) {
        setStockLevels({});
        return;
      }
      const newStockLevels: Record<string, number> = {};
      for (const item of watchItems) {
        if (item.productId) {
          try {
            const result = await inventoryService.getAvailableQuantity(
              item.productId,
              item.productVariantId || undefined,
              watchWarehouseId
            );
            const key = `${item.productId}_${item.productVariantId || 'null'}`;
            newStockLevels[key] = result.data.quantity;
          } catch {
            const key = `${item.productId}_${item.productVariantId || 'null'}`;
            newStockLevels[key] = 0;
          }
        }
      }
      setStockLevels(newStockLevels);
    };
    fetchStockLevels();
  }, [watchWarehouseId, watchItems.map(i => `${i.productId}_${i.productVariantId}`).join(',')]);

  const onSubmit = async (data: DNFormData) => {
    try {
      await createDN.mutateAsync({
        salesOrderId: data.salesOrderId || undefined,
        clientId: data.clientId,
        warehouseId: data.warehouseId,
        deliveryAddress: data.deliveryAddress || undefined,
        driverName: data.driverName || undefined,
        vehicleNo: data.vehicleNo || undefined,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          salesOrderItemId: item.salesOrderItemId || undefined,
          productId: item.productId,
          productVariantId: item.productVariantId || undefined,
          quantity: item.quantity,
        })),
      });
      navigate('/delivery-notes');
    } catch {
      // Error handled by mutation
    }
  };

  if (loadingSO) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Sales', href: '/sales-orders' },
          { label: 'Delivery Notes', href: '/delivery-notes' },
          { label: 'New Delivery Note' },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <button
          onClick={() => navigate('/delivery-notes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Delivery Notes
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Delivery Note</h1>
        {salesOrderId && (
          <p className="text-sm text-blue-600 mt-1">Creating from Sales Order</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                {...register('clientId')}
                disabled={!!salesOrderId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Customer</option>
                {clientsData?.data.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.city || 'N/A'}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-sm mt-1">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                {...register('warehouseId')}
                disabled={!!salesOrderId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Warehouse</option>
                {warehousesData?.data.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouseId && (
                <p className="text-red-500 text-sm mt-1">{errors.warehouseId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
              <input
                type="text"
                {...register('driverName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Driver name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label>
              <input
                type="text"
                {...register('vehicleNo')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Vehicle number"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            <textarea
              {...register('deliveryAddress')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Delivery address..."
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Items</h2>
            {!salesOrderId && (
              <button
                type="button"
                onClick={() =>
                  append({ productId: '', productVariantId: null, quantity: 1 })
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={20} />
                Add Item
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Available</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Quantity</th>
                  {salesOrderId && (
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Max</th>
                  )}
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = watchItems[index];
                  const stockKey = `${item?.productId}_${item?.productVariantId || 'null'}`;
                  const availableStock = stockLevels[stockKey] || 0;
                  const isStockInsufficient =
                    item?.quantity > availableStock && !!item?.productId && !!watchWarehouseId;

                  return (
                    <tr key={field.id} className="border-b">
                      <td className="py-2 px-2">
                        {salesOrderId ? (
                          <span className="text-sm text-gray-900">
                            {productsData?.data.find((p: any) => p.id === item?.productId)?.name ||
                              item?.productId}
                          </span>
                        ) : (
                          <select
                            {...register(`items.${index}.productId`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Product</option>
                            {productsData?.data.map((product: any) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {item?.productId && watchWarehouseId ? (
                          <div className="flex items-center gap-1">
                            {availableStock >= (item?.quantity || 0) ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : (
                              <AlertTriangle size={14} className="text-red-600" />
                            )}
                            <span
                              className={`font-medium ${
                                availableStock === 0
                                  ? 'text-red-600'
                                  : availableStock < (item?.quantity || 0)
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {availableStock}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          max={item?.maxQuantity}
                          className={`w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ${
                            isStockInsufficient
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {isStockInsufficient && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Exceeds stock
                          </p>
                        )}
                      </td>
                      {salesOrderId && (
                        <td className="py-2 px-2 text-sm text-gray-500">
                          {item?.maxQuantity || '-'}
                        </td>
                      )}
                      <td className="py-2 px-2">
                        {!salesOrderId && fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/delivery-notes')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save size={20} />
            {isSubmitting ? 'Creating...' : 'Create Delivery Note'}
          </button>
        </div>
      </form>
    </div>
  );
};
