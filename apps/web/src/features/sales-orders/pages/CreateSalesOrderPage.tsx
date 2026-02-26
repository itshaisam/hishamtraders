import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Save, ArrowLeft, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { useCreateSalesOrder, useConfirmSalesOrder } from '../../../hooks/useSalesOrders';
import { useClients } from '../../../hooks/useClients';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { useGetTaxRate, useCurrencySymbol } from '../../../hooks/useSettings';
import { useProducts } from '../../products/hooks/useProducts';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import { inventoryService } from '../../../services/inventoryService';
import toast from 'react-hot-toast';

const soItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productVariantId: z.string().nullable().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price must be positive'),
  discount: z.number().min(0).max(100, 'Discount must be between 0 and 100'),
});

const createSOFormSchema = z.object({
  clientId: z.string().min(1, 'Customer is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  paymentType: z.enum(['CASH', 'CREDIT']),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(soItemSchema).min(1, 'At least one item is required'),
});

type SOFormData = z.infer<typeof createSOFormSchema>;

export const CreateSalesOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const createSO = useCreateSalesOrder();
  const confirmSO = useConfirmSalesOrder();
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });
  const { data: taxRateData } = useGetTaxRate();
  const taxRate = taxRateData?.taxRate ?? 18;
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});
  const [saveAction, setSaveAction] = useState<'draft' | 'confirm'>('draft');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SOFormData>({
    resolver: zodResolver(createSOFormSchema),
    defaultValues: {
      paymentType: 'CASH',
      items: [{ productId: '', productVariantId: null, quantity: 1, unitPrice: 0, discount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchClientId = watch('clientId');
  const watchPaymentType = watch('paymentType');
  const watchItems = watch('items');
  const watchWarehouseId = watch('warehouseId');

  // Fetch stock levels when warehouse or products change
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

  // Update selected client
  useEffect(() => {
    if (watchClientId && clientsData?.data) {
      const client = clientsData.data.find((c) => c.id === watchClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [watchClientId, clientsData]);

  // Calculate totals
  const subtotal = watchItems.reduce((sum, item) => {
    const lineSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const discountAmount = lineSubtotal * ((item.discount || 0) / 100);
    return sum + (lineSubtotal - discountAmount);
  }, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Credit limit check
  const showCreditWarning =
    watchPaymentType === 'CREDIT' &&
    selectedClient &&
    Number(selectedClient.creditLimit) > 0 &&
    Number(selectedClient.balance) + total > Number(selectedClient.creditLimit);

  const onSubmit = async (data: SOFormData) => {
    try {
      const order = await createSO.mutateAsync({
        clientId: data.clientId,
        warehouseId: data.warehouseId,
        paymentType: data.paymentType,
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      });

      if (saveAction === 'confirm' && order?.id) {
        try {
          await confirmSO.mutateAsync(order.id);
        } catch {
          toast.error('Order created as DRAFT but confirmation failed');
        }
      }

      navigate('/sales-orders');
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs
        items={[
          { label: 'Sales', href: '/sales-orders' },
          { label: 'Sales Orders', href: '/sales-orders' },
          { label: 'New Order' },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <button
          onClick={() => navigate('/sales-orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Sales Orders
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Sales Order</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                {...register('clientId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                {...register('warehouseId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('paymentType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                {...register('expectedDeliveryDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client Info */}
          {selectedClient && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Balance:</span>
                  <span className="ml-2 font-semibold">{formatCurrencyDecimal(Number(selectedClient.balance), cs)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="ml-2 font-semibold">{formatCurrencyDecimal(Number(selectedClient.creditLimit), cs)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Payment Terms:</span>
                  <span className="ml-2 font-semibold">{selectedClient.paymentTermsDays} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 font-semibold ${selectedClient.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedClient.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Credit Limit Warning */}
        {showCreditWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-yellow-800 font-medium">Credit Limit Warning</p>
              <p className="text-yellow-700 text-sm">
                This order would bring the customer&apos;s balance to{' '}
                {formatCurrencyDecimal(Number(selectedClient.balance) + total, cs)}, exceeding their
                credit limit of {formatCurrencyDecimal(Number(selectedClient.creditLimit), cs)}.
                The order can still be saved.
              </p>
            </div>
          </div>
        )}

        {/* Line Items Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order Items</h2>
            <button
              type="button"
              onClick={() =>
                append({ productId: '', productVariantId: null, quantity: 1, unitPrice: 0, discount: 0 })
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={20} />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Available</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Quantity</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Unit Price</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Discount (%)</th>
                  <th className="text-right py-2 px-2 text-sm font-medium text-gray-700">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = watchItems[index];
                  const lineSubtotal = (item?.quantity || 0) * (item?.unitPrice || 0);
                  const discountAmount = lineSubtotal * ((item?.discount || 0) / 100);
                  const lineTotal = lineSubtotal - discountAmount;
                  const stockKey = `${item?.productId}_${item?.productVariantId || 'null'}`;
                  const availableStock = stockLevels[stockKey] || 0;
                  const isStockInsufficient =
                    item?.quantity > availableStock && !!item?.productId && !!watchWarehouseId;

                  return (
                    <tr key={field.id} className="border-b">
                      <td className="py-2 px-2">
                        <select
                          {...register(`items.${index}.productId`)}
                          onChange={(e) => {
                            const productId = e.target.value;
                            setValue(`items.${index}.productId`, productId);
                            if (productId && productsData?.data) {
                              const selectedProduct = productsData.data.find(
                                (p: any) => p.id === productId
                              );
                              if (selectedProduct?.sellingPrice) {
                                setValue(
                                  `items.${index}.unitPrice`,
                                  Number(selectedProduct.sellingPrice)
                                );
                              }
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Product</option>
                          {productsData?.data.map((product: any) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[index]?.productId?.message}
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {item?.productId && watchWarehouseId ? (
                          <div className="flex items-center gap-1">
                            {availableStock >= (item?.quantity || 0) ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : (
                              <AlertTriangle size={14} className="text-yellow-600" />
                            )}
                            <span
                              className={`font-medium ${
                                availableStock === 0
                                  ? 'text-red-600'
                                  : availableStock < (item?.quantity || 0)
                                  ? 'text-yellow-600'
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
                          className={`w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ${
                            isStockInsufficient
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {isStockInsufficient && (
                          <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Low stock
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.0001"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.discount`, { valueAsNumber: true })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {formatCurrencyDecimal(lineTotal, cs)}
                      </td>
                      <td className="py-2 px-2">
                        {fields.length > 1 && (
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
          {errors.items && typeof errors.items.message === 'string' && (
            <p className="text-red-500 text-sm mt-2">{errors.items.message}</p>
          )}
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes..."
          />
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrencyDecimal(subtotal, cs)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax ({taxRate}%):</span>
              <span className="font-medium">{formatCurrencyDecimal(taxAmount, cs)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
              <span>Total:</span>
              <span>{formatCurrencyDecimal(total, cs)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/sales-orders')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSaveAction('draft')}
            className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
          >
            <Save size={20} />
            {isSubmitting && saveAction === 'draft' ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSaveAction('confirm')}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            <CheckCircle size={20} />
            {isSubmitting && saveAction === 'confirm' ? 'Saving...' : 'Save & Confirm'}
          </button>
        </div>
      </form>
    </div>
  );
};
