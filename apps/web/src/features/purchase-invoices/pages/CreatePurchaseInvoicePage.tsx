import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useCreatePurchaseInvoice } from '../../../hooks/usePurchaseInvoices';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';
import { useProducts } from '../../products/hooks/useProducts';
import { Button, Breadcrumbs, Spinner, Combobox } from '../../../components/ui';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';
import { apiClient } from '../../../lib/api-client';
import toast from 'react-hot-toast';

interface LineItem {
  productId: string;
  productVariantId: string | null;
  productName: string;
  variantName: string;
  quantity: number;
  unitCost: number;
}

export const CreatePurchaseInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const grnId = searchParams.get('grnId');
  const poId = searchParams.get('poId');

  const createPI = useCreatePurchaseInvoice();
  const { data: suppliersData } = useSuppliers();
  const { data: productsData } = useProducts({ limit: 500 });
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [linkedPoId, setLinkedPoId] = useState<string | null>(null);
  const [linkedGrnId, setLinkedGrnId] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillSource, setPrefillSource] = useState<string | null>(null);

  // Pre-fill from GRN or PO
  useEffect(() => {
    if (grnId) {
      setPrefillLoading(true);
      setPrefillSource('GRN');
      apiClient.get(`/goods-receipts/${grnId}`).then((res) => {
        const grn = res.data;
        setSupplierId(grn.purchaseOrder?.supplierId || '');
        setLinkedGrnId(grn.id);
        setLinkedPoId(grn.poId || null);

        // Fetch PO items for costs
        if (grn.poId) {
          apiClient.get(`/purchase-orders/${grn.poId}`).then((poRes) => {
            const po = poRes.data;
            const poItemMap = new Map<string, number>();
            po.items?.forEach((poItem: any) => {
              const key = `${poItem.productId}|${poItem.productVariantId || ''}`;
              poItemMap.set(key, Number(poItem.unitCost));
            });

            const prefilled: LineItem[] = (grn.items || []).map((item: any) => {
              const key = `${item.productId}|${item.productVariantId || ''}`;
              return {
                productId: item.productId,
                productVariantId: item.productVariantId || null,
                productName: item.product?.name || '',
                variantName: item.productVariant?.variantName || '',
                quantity: item.quantity,
                unitCost: poItemMap.get(key) || 0,
              };
            });
            setItems(prefilled);
            setPrefillLoading(false);
          }).catch(() => {
            // fallback: items without costs
            const prefilled: LineItem[] = (grn.items || []).map((item: any) => ({
              productId: item.productId,
              productVariantId: item.productVariantId || null,
              productName: item.product?.name || '',
              variantName: item.productVariant?.variantName || '',
              quantity: item.quantity,
              unitCost: 0,
            }));
            setItems(prefilled);
            setPrefillLoading(false);
          });
        } else {
          const prefilled: LineItem[] = (grn.items || []).map((item: any) => ({
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            productName: item.product?.name || '',
            variantName: item.productVariant?.variantName || '',
            quantity: item.quantity,
            unitCost: 0,
          }));
          setItems(prefilled);
          setPrefillLoading(false);
        }
      }).catch(() => {
        toast.error('Failed to load GRN data');
        setPrefillLoading(false);
      });
    } else if (poId) {
      setPrefillLoading(true);
      setPrefillSource('PO');
      apiClient.get(`/purchase-orders/${poId}`).then((res) => {
        const po = res.data;
        setSupplierId(po.supplierId || '');
        setLinkedPoId(po.id);

        const prefilled: LineItem[] = (po.items || []).map((item: any) => ({
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          productName: item.product?.name || '',
          variantName: item.productVariant?.variantName || '',
          quantity: item.quantity,
          unitCost: Number(item.unitCost),
        }));
        setItems(prefilled);
        setPrefillLoading(false);
      }).catch(() => {
        toast.error('Failed to load PO data');
        setPrefillLoading(false);
      });
    }
  }, [grnId, poId]);

  const suppliers = suppliersData?.data || suppliersData || [];
  const supplierOptions = (Array.isArray(suppliers) ? suppliers : []).map((s: any) => ({
    value: s.id,
    label: s.name,
  }));

  const products = productsData?.data || productsData || [];
  const productOptions = (Array.isArray(products) ? products : []).map((p: any) => ({
    value: p.id,
    label: `${p.name} (${p.sku})`,
  }));

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0), [items]);
  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const addItem = () => {
    setItems([...items, { productId: '', productVariantId: null, productName: '', variantName: '', quantity: 1, unitCost: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'productId') {
        const product = (Array.isArray(products) ? products : []).find((p: any) => p.id === value);
        updated.productName = product?.name || '';
      }
      return updated;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) { toast.error('Please select a supplier'); return; }
    if (!invoiceNumber.trim()) { toast.error('Please enter the supplier invoice number'); return; }
    if (!items.length) { toast.error('Please add at least one item'); return; }
    if (items.some(i => !i.productId)) { toast.error('All items must have a product selected'); return; }
    if (items.some(i => i.quantity <= 0)) { toast.error('All quantities must be positive'); return; }
    if (items.some(i => i.unitCost <= 0)) { toast.error('All unit costs must be positive'); return; }

    try {
      const result = await createPI.mutateAsync({
        invoiceNumber: invoiceNumber.trim(),
        supplierId,
        ...(linkedPoId && { poId: linkedPoId }),
        ...(linkedGrnId && { grnId: linkedGrnId }),
        invoiceDate,
        ...(dueDate && { dueDate }),
        taxRate,
        ...(notes.trim() && { notes: notes.trim() }),
        items: items.map(i => ({
          productId: i.productId,
          productVariantId: i.productVariantId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      });
      navigate(`/purchase-invoices/${result.id}`);
    } catch {
      // handled by mutation
    }
  };

  if (prefillLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Purchase Invoices', href: '/purchase-invoices' },
          { label: 'New Purchase Invoice' },
        ]}
        className="mb-4"
      />

      <h1 className="text-2xl font-bold text-gray-900">
        New Purchase Invoice
        {prefillSource && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Pre-filled from {prefillSource})
          </span>
        )}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Fields */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              {prefillSource ? (
                <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm">
                  {supplierOptions.find(s => s.value === supplierId)?.label || 'Loading...'}
                </div>
              ) : (
                <Combobox
                  options={supplierOptions}
                  value={supplierId}
                  onChange={(val) => setSupplierId(val as string)}
                  placeholder="Select supplier..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Invoice # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Supplier's invoice number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Optional notes"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            {!prefillSource && (
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus size={14} className="mr-1" /> Add Item
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">Product</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900">Variant</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-900 w-24">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-900 w-32">Unit Cost</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-900 w-32">Total</th>
                  {!prefillSource && (
                    <th className="px-3 py-2 text-center font-semibold text-gray-900 w-16"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="px-3 py-2">
                      {prefillSource ? (
                        <span className="text-gray-900">{item.productName}</span>
                      ) : (
                        <Combobox
                          options={productOptions}
                          value={item.productId}
                          onChange={(val) => updateItem(idx, 'productId', val)}
                          placeholder="Select product..."
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{item.variantName || '-'}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm"
                        min="1"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm"
                        min="0"
                        step="0.0001"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrencyDecimal(item.quantity * item.unitCost, cs)}
                    </td>
                    {!prefillSource && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!items.length && (
            <p className="text-center text-gray-400 py-4">No items added yet</p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex justify-between w-64">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrencyDecimal(subtotal, cs)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600">Tax ({taxRate}%):</span>
              <span>{formatCurrencyDecimal(taxAmount, cs)}</span>
            </div>
            <hr className="w-64 border-gray-300" />
            <div className="flex justify-between w-64">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrencyDecimal(total, cs)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/purchase-invoices')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={createPI.isPending}>
            {createPI.isPending ? 'Creating...' : 'Create Purchase Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
};
