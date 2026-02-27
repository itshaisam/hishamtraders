import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { Spinner } from '../../../components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, parseISO } from 'date-fns';
import { Plus, Save, ArrowLeft, Trash2, AlertTriangle, Link2, Info } from 'lucide-react';
import { useCreateInvoice } from '../../../hooks/useInvoices';
import { useClients } from '../../../hooks/useClients';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { useGetTaxRate, useCurrencySymbol } from '../../../hooks/useSettings';
import { useWorkflowSettings } from '../../../hooks/useWorkflowSettings';
import { formatCurrency, formatCurrencyDecimal } from '../../../lib/formatCurrency';
import { useProducts } from '../../products/hooks/useProducts';
import { CreateInvoiceDto, InvoicePaymentType } from '../../../types/invoice.types';
import { InvoiceSummary } from '../components/InvoiceSummary';
import { CreditLimitWarning } from '../components/CreditLimitWarning';
import { inventoryService } from '../../../services/inventoryService';
import { invoicesService } from '../../../services/invoicesService';
import { salesOrderService } from '../../../services/salesOrderService';
import { deliveryNoteService } from '../../../services/deliveryNoteService';
import toast from 'react-hot-toast';

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
  const [searchParams] = useSearchParams();
  const salesOrderIdParam = searchParams.get('salesOrderId');
  const deliveryNoteIdParam = searchParams.get('deliveryNoteId');

  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients({ page: 1, limit: 1000 });
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: productsData } = useProducts({ page: 1, limit: 1000 });
  const { data: taxRateData } = useGetTaxRate();
  const defaultTaxRate = taxRateData?.taxRate ?? 18;
  const [taxRate, setTaxRate] = useState<number>(18);
  const [taxRateInitialized, setTaxRateInitialized] = useState(false);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: wfSettings } = useWorkflowSettings();

  // Initialize tax rate from setting once loaded
  useEffect(() => {
    if (!taxRateInitialized && taxRateData !== undefined) {
      setTaxRate(defaultTaxRate);
      setTaxRateInitialized(true);
    }
  }, [taxRateData, defaultTaxRate, taxRateInitialized]);

  // Workflow enforcement: Check if direct invoice creation is blocked
  const requireSO = wfSettings?.['sales.requireSalesOrder'] ?? false;
  const requireDN = wfSettings?.['sales.requireDeliveryNote'] ?? false;
  const allowDirect = wfSettings?.['sales.allowDirectInvoice'] ?? true;
  const isDirectBlocked = requireSO || requireDN || !allowDirect;

  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [creditOverrideEnabled, setCreditOverrideEnabled] = useState(false);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  // Prefill state
  const [loadingPrefill, setLoadingPrefill] = useState(!!salesOrderIdParam || !!deliveryNoteIdParam);
  const [linkedSalesOrderId, setLinkedSalesOrderId] = useState<string | undefined>();
  const [linkedDeliveryNoteId, setLinkedDeliveryNoteId] = useState<string | undefined>();
  const [prefillSource, setPrefillSource] = useState<string | null>(null); // 'SO' or 'DN'
  const [prefillLabel, setPrefillLabel] = useState<string>('');

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

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });

  // Pre-fill from Sales Order or Delivery Note
  useEffect(() => {
    if (!salesOrderIdParam && !deliveryNoteIdParam) return;
    // For DN path, wait for product data to be available for pricing lookup
    if (deliveryNoteIdParam && !productsData?.data) return;
    // Don't re-run if already prefilled
    if (prefillSource) return;

    const prefill = async () => {
      setLoadingPrefill(true);
      try {
        if (salesOrderIdParam) {
          // Path A: From Sales Order — use invoiceable items endpoint
          const data = await salesOrderService.getInvoiceableItems(salesOrderIdParam);
          setValue('clientId', data.clientId);
          setValue('warehouseId', data.warehouseId);
          if (data.paymentType) {
            setValue('paymentType', data.paymentType);
          }
          const items = data.items.map((item: any) => ({
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            quantity: item.remainingQuantity,
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount || 0),
          }));
          if (items.length > 0) replace(items);
          setLinkedSalesOrderId(salesOrderIdParam);
          setPrefillSource('SO');
          setPrefillLabel(data.orderNumber);
        } else if (deliveryNoteIdParam) {
          // Path B: From Delivery Note — fetch DN detail
          const dn = await deliveryNoteService.getById(deliveryNoteIdParam);
          setValue('clientId', dn.clientId);
          setValue('warehouseId', dn.warehouseId);
          // Map DN items to invoice items (DN has no pricing, use product catalog)
          const items = dn.items.map((item: any) => {
            const product = productsData?.data?.find((p: any) => p.id === item.productId);
            return {
              productId: item.productId,
              productVariantId: item.productVariantId || null,
              quantity: item.quantity,
              unitPrice: product ? Number(product.sellingPrice) : 0,
              discount: 0,
            };
          });
          if (items.length > 0) replace(items);
          setLinkedDeliveryNoteId(deliveryNoteIdParam);
          if (dn.salesOrderId) setLinkedSalesOrderId(dn.salesOrderId);
          setPrefillSource('DN');
          setPrefillLabel(dn.deliveryNoteNumber);
        }
      } catch {
        toast.error('Failed to load source document');
      } finally {
        setLoadingPrefill(false);
      }
    };

    prefill();
  }, [salesOrderIdParam, deliveryNoteIdParam, productsData]);

  const watchClientId = watch('clientId');
  const watchPaymentType = watch('paymentType');
  const watchItems = watch('items');
  const watchWarehouseId = watch('warehouseId');
  const watchInvoiceDate = watch('invoiceDate');

  // Compute due date from invoice date + client payment terms
  const computedDueDate = selectedClient && watchInvoiceDate
    ? format(addDays(parseISO(watchInvoiceDate), selectedClient.paymentTermsDays || 30), 'dd MMM yyyy')
    : null;

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
        taxRate,
        salesOrderId: linkedSalesOrderId,
        deliveryNoteId: linkedDeliveryNoteId,
      };

      const result = await createInvoice.mutateAsync(payload);

      // Offer to copy shareable PDF link
      if (result?.id) {
        toast((t) => (
          <div className="flex items-center gap-3">
            <span>Invoice created!</span>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1 hover:bg-blue-700"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const shareData = await invoicesService.generateShareToken(result.id);
                  await navigator.clipboard.writeText(shareData.url);
                  toast.success('PDF link copied to clipboard!');
                } catch {
                  toast.error('Failed to generate share link');
                }
              }}
            >
              <Link2 size={14} /> Copy Share Link
            </button>
          </div>
        ), { duration: 8000 });
      }

      navigate('/invoices');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (loadingPrefill) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Sales', href: '/invoices' }, { label: 'Invoices', href: '/invoices' }, { label: 'Create Invoice' }]} className="mb-4" />
      <div className="mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Invoices
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        {prefillSource && (
          <p className="text-sm text-blue-600 mt-1">
            Creating from {prefillSource === 'SO' ? 'Sales Order' : 'Delivery Note'} {prefillLabel}
          </p>
        )}
      </div>

      {/* Workflow enforcement banner — only show when creating directly (not from SO/DN) */}
      {isDirectBlocked && !prefillSource && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Workflow restrictions active</p>
            <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
              {requireSO && <li>Sales Order is required — create an invoice from a <a href="/sales-orders" className="underline font-medium">Sales Order</a></li>}
              {requireDN && <li>Delivery Note is required — create an invoice from a <a href="/delivery-notes" className="underline font-medium">Delivery Note</a></li>}
              {!allowDirect && !requireSO && !requireDN && <li>Direct invoice creation is disabled — use a Sales Order or Delivery Note</li>}
            </ul>
            <p className="mt-2 text-xs text-amber-600">These settings can be changed in <a href="/settings?tab=workflow" className="underline">System Settings</a>.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                {...register('clientId')}
                disabled={!!prefillSource}
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

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                {...register('warehouseId')}
                disabled={!!prefillSource}
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
                disabled={prefillSource === 'SO'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="CASH">Cash</option>
                <option value="CREDIT">Credit</option>
              </select>
              {errors.paymentType && (
                <p className="text-red-500 text-sm mt-1">{errors.paymentType.message}</p>
              )}
            </div>
          </div>

          {/* Computed Due Date */}
          {computedDueDate && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded-md px-4 py-2">
              <span className="text-blue-700 font-medium">Due Date:</span>
              <span className="text-blue-900 font-semibold">{computedDueDate}</span>
              <span className="text-blue-600">({selectedClient.paymentTermsDays} days from invoice date)</span>
            </div>
          )}

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
            {!prefillSource && (
              <button
                type="button"
                onClick={() => append({ productId: '', productVariantId: null, quantity: 1, unitPrice: 0, discount: 0 })}
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
                        {prefillSource ? (
                          <span className="text-sm text-gray-900">
                            {productsData?.data?.find((p: any) => p.id === item?.productId)?.name || item?.productId}
                          </span>
                        ) : (
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
                        )}
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
                          step="0.0001"
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
                        {!prefillSource && fields.length > 1 && (
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
        <InvoiceSummary subtotal={subtotal} taxAmount={taxAmount} total={total} taxRate={taxRate} onTaxRateChange={setTaxRate} />

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
