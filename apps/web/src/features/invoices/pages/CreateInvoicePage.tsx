import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Save, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useCreateInvoice } from '../../../hooks/useInvoices';
import { useClients } from '../../../hooks/useClients';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { useGetTaxRate, useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrency, formatCurrencyDecimal } from '../../../lib/formatCurrency';
import { useProducts } from '../../products/hooks/useProducts';
import { CreateInvoiceDto, InvoicePaymentType } from '../../../types/invoice.types';
import { InvoiceSummary } from '../components/InvoiceSummary';
import { CreditLimitWarning } from '../components/CreditLimitWarning';
import { inventoryService } from '../../../services/inventoryService';

const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productVariantId: z.string().nullable().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price must be positive'),
  discount: z.number().min(0).max(100, 'Discount must be between 0 and 100'),
});

const createInvoiceFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  paymentType: z.enum(['CASH', 'CREDIT']),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  adminOverride: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof createInvoiceFormSchema>;

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });
  const { data: taxRateData } = useGetTaxRate();
  const taxRate = taxRateData?.taxRate ?? 18;
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [creditOverrideEnabled, setCreditOverrideEnabled] = useState(false);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
      paymentType: 'CASH',
      items: [{ productId: '', productVariantId: null, quantity: 1, unitPrice: 0, discount: 0 }],
      adminOverride: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

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
          } catch (error) {
            console.error('Error fetching stock:', error);
            const key = `${item.productId}_${item.productVariantId || 'null'}`;
            newStockLevels[key] = 0;
          }
        }
      }

      setStockLevels(newStockLevels);
    };

    fetchStockLevels();
  }, [watchWarehouseId, watchItems.map(i => `${i.productId}_${i.productVariantId}`).join(',')]);

  // Update selected client when clientId changes
  useEffect(() => {
    if (watchClientId && clientsData?.data) {
      const client = clientsData.data.find((c) => c.id === watchClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [watchClientId, clientsData]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = watchItems.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discountAmount = lineSubtotal * (item.discount / 100);
      return sum + (lineSubtotal - discountAmount);
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  // Check credit limit
  useEffect(() => {
    if (watchPaymentType === 'CREDIT' && selectedClient) {
      const newBalance = Number(selectedClient.balance) + total;
      const creditLimit = Number(selectedClient.creditLimit);
      const utilization = (newBalance / creditLimit) * 100;

      setShowCreditWarning(utilization > 80);
    } else {
      setShowCreditWarning(false);
    }
  }, [watchPaymentType, selectedClient, total]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const payload: CreateInvoiceDto = {
        ...data,
        paymentType: data.paymentType as InvoicePaymentType,
        adminOverride: creditOverrideEnabled && data.adminOverride,
        overrideReason: creditOverrideEnabled && data.adminOverride ? data.overrideReason : undefined,
      };

      await createInvoice.mutateAsync(payload);
      navigate('/invoices');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Invoices
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                {...register('clientId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Client</option>
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

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('invoiceDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.invoiceDate && (
                <p className="text-red-500 text-sm mt-1">{errors.invoiceDate.message}</p>
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
              {errors.paymentType && (
                <p className="text-red-500 text-sm mt-1">{errors.paymentType.message}</p>
              )}
            </div>
          </div>

          {/* Client Info */}
          {selectedClient && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Balance:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(Number(selectedClient.balance), cs)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(Number(selectedClient.creditLimit), cs)}</span>
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
        {showCreditWarning && selectedClient && (
          <CreditLimitWarning
            client={selectedClient}
            invoiceTotal={total}
            onOverrideChange={(enabled) => {
              setCreditOverrideEnabled(enabled);
              setValue('adminOverride', enabled);
            }}
            register={register}
            errors={errors}
          />
        )}

        {/* Line Items Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Invoice Items</h2>
            <button
              type="button"
              onClick={() => append({ productId: '', productVariantId: null, quantity: 1, unitPrice: 0, discount: 0 })}
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
                  const isStockInsufficient = item?.quantity > availableStock && item?.productId && watchWarehouseId;

                  return (
                    <tr key={field.id} className="border-b">
                      <td className="py-2 px-2">
                        <select
                          {...register(`items.${index}.productId`)}
                          onChange={(e) => {
                            const productId = e.target.value;
                            setValue(`items.${index}.productId`, productId);

                            // Auto-populate unit price when product is selected
                            if (productId && productsData?.data) {
                              const selectedProduct = productsData.data.find((p: any) => p.id === productId);
                              if (selectedProduct?.sellingPrice) {
                                setValue(`items.${index}.unitPrice`, Number(selectedProduct.sellingPrice));
                              }
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Product</option>
                          {productsData?.data.map((product: any) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku}) - {formatCurrency(Number(product.sellingPrice), cs)}
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="text-red-500 text-xs mt-1">{errors.items[index]?.productId?.message}</p>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {item?.productId && watchWarehouseId ? (
                          <div className="flex items-center gap-1">
                            <span className={`font-medium ${availableStock === 0 ? 'text-red-600' : availableStock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {availableStock}
                            </span>
                            {availableStock === 0 && (
                              <AlertTriangle size={14} className="text-red-600" />
                            )}
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
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-red-500 text-xs mt-1">{errors.items[index]?.quantity?.message}</p>
                        )}
                        {isStockInsufficient && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Exceeds available stock
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-red-500 text-xs mt-1">{errors.items[index]?.unitPrice?.message}</p>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.discount`, { valueAsNumber: true })}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.items?.[index]?.discount && (
                          <p className="text-red-500 text-xs mt-1">{errors.items[index]?.discount?.message}</p>
                        )}
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
        <InvoiceSummary subtotal={subtotal} taxAmount={taxAmount} total={total} taxRate={taxRate} />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
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
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
