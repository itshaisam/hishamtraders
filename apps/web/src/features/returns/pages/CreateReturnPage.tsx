import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useInvoiceById } from '../../../hooks/useInvoices';
import { useCreateCreditNote } from '../../../hooks/useCreditNotes';
import { CreateCreditNoteDto } from '../../../types/credit-note.types';

interface ReturnItem {
  invoiceItemId: string;
  productName: string;
  variantName?: string;
  sku: string;
  originalQty: number;
  alreadyReturned: number;
  maxReturnable: number;
  quantityReturned: number;
  unitPrice: number;
  discount: number;
}

export function CreateReturnPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoiceById(invoiceId!);
  const createMutation = useCreateCreditNote();

  const [reason, setReason] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize return items once invoice loads
  if (invoice && !initialized) {
    const items: ReturnItem[] = invoice.items.map((item) => ({
      invoiceItemId: item.id,
      productName: item.product.name,
      variantName: item.productVariant?.variantName,
      sku: item.productVariant?.sku || item.product.sku,
      originalQty: item.quantity,
      alreadyReturned: 0, // Will be calculated server-side for validation
      maxReturnable: item.quantity, // Server validates the actual max
      quantityReturned: 0,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
    }));
    setReturnItems(items);
    setInitialized(true);
  }

  const updateQuantity = (index: number, qty: number) => {
    setReturnItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantityReturned: Math.min(Math.max(0, qty), updated[index].maxReturnable),
      };
      return updated;
    });
  };

  const selectedItems = returnItems.filter((item) => item.quantityReturned > 0);

  const calculateLineTotal = (item: ReturnItem) => {
    const sub = item.quantityReturned * item.unitPrice;
    return sub - sub * (item.discount / 100);
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  // Use snapshot taxRate if available; fall back to deriving from amounts for legacy invoices
  const taxRate = invoice
    ? (Number(invoice.taxRate) || (Number(invoice.taxAmount) / Math.max(Number(invoice.subtotal), 1)) * 100)
    : 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalCredit = subtotal + taxAmount;

  const handleSubmit = () => {
    if (!invoiceId || selectedItems.length === 0 || reason.length < 5) return;

    const dto: CreateCreditNoteDto = {
      invoiceId,
      reason,
      items: selectedItems.map((item) => ({
        invoiceItemId: item.invoiceItemId,
        quantityReturned: item.quantityReturned,
      })),
    };

    createMutation.mutate(dto, {
      onSuccess: (creditNote) => {
        navigate(`/returns/${creditNote.id}`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Invoice not found</div>
      </div>
    );
  }

  if (invoice.status !== 'PAID' && invoice.status !== 'PARTIAL') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-yellow-900">Not Eligible for Return</h2>
          <p className="text-yellow-700 mt-2">
            Only PAID or PARTIAL invoices can have returns. This invoice is {invoice.status}.
          </p>
          <button
            onClick={() => navigate(`/invoices/${invoiceId}`)}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Back to Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/invoices/${invoiceId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Invoice
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Sales Return</h1>
        <p className="text-sm text-gray-600 mt-1">
          Invoice: <span className="font-medium">{invoice.invoiceNumber}</span> |
          Client: <span className="font-medium">{invoice.client.name}</span> |
          Date: {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
        </p>
      </div>

      {/* Reason */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Return Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={3}
          placeholder="Describe the reason for return (min 5 characters)..."
        />
        {reason.length > 0 && reason.length < 5 && (
          <p className="text-xs text-red-500 mt-1">Reason must be at least 5 characters</p>
        )}
      </div>

      {/* Items Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Items to Return</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Discount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Sold Qty</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Return Qty</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {returnItems.map((item, index) => (
                <tr
                  key={item.invoiceItemId}
                  className={item.quantityReturned > 0 ? 'bg-blue-50' : ''}
                >
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    {item.variantName && (
                      <div className="text-xs text-gray-500">{item.variantName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.sku}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    PKR {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">{item.discount}%</td>
                  <td className="py-3 px-4 text-sm text-right">{item.originalQty}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantityReturned - 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        disabled={item.quantityReturned <= 0}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantityReturned}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border rounded py-1 text-sm"
                        min={0}
                        max={item.maxReturnable}
                      />
                      <button
                        onClick={() => updateQuantity(index, item.quantityReturned + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        disabled={item.quantityReturned >= item.maxReturnable}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 text-center mt-1">
                      max: {item.maxReturnable}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium">
                    {item.quantityReturned > 0
                      ? `PKR ${calculateLineTotal(item).toLocaleString()}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Credit Summary</h2>
        <div className="max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">PKR {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax ({taxRate.toFixed(1)}%):</span>
            <span className="font-medium">PKR {taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
            <span>Total Credit:</span>
            <span className="text-green-700">PKR {totalCredit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => navigate(`/invoices/${invoiceId}`)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            selectedItems.length === 0 ||
            reason.length < 5 ||
            createMutation.isPending
          }
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Credit Note'}
        </button>
      </div>
    </div>
  );
}
