import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, MapPin, Building2, CreditCard, FileText, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useInvoiceById, useVoidInvoice, useInvoices } from '../../../hooks/useInvoices';
import { VoidInvoiceModal } from '../components/VoidInvoiceModal';
import { useAuthStore } from '../../../stores/auth.store';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, error } = useInvoiceById(id!);
  const { user } = useAuthStore();
  const voidMutation = useVoidInvoice();
  const [showVoidModal, setShowVoidModal] = useState(false);

  // Check if user can void this invoice
  const canVoid =
    invoice?.status === 'PENDING' &&
    (user?.role?.name === 'ADMIN' || user?.role?.name === 'ACCOUNTANT');

  // Check if user can create a return for this invoice
  const canReturn =
    (invoice?.status === 'PAID' || invoice?.status === 'PARTIAL') &&
    (user?.role?.name === 'ADMIN' || user?.role?.name === 'ACCOUNTANT');

  const handleVoidConfirm = (reason: string) => {
    if (!id) return;
    voidMutation.mutate(
      { invoiceId: id, reason },
      {
        onSuccess: () => {
          setShowVoidModal(false);
        },
      }
    );
  };

  // Fetch all invoices for this client (for credit history)
  const { data: clientInvoicesData } = useInvoices(
    invoice?.clientId ? { clientId: invoice.clientId, limit: 1000 } : undefined
  );

  // Calculate credit history totals
  const creditHistory = useMemo(() => {
    if (!clientInvoicesData?.data) return null;

    // Filter out VOIDED invoices from totals
    const activeInvoices = clientInvoicesData.data.filter(inv => inv.status !== 'VOIDED');

    const totalCredit = activeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = activeInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const outstandingBalance = totalCredit - totalPaid;

    return {
      invoices: clientInvoicesData.data, // Include all for display (including voided with strikethrough)
      totalCredit,
      totalPaid,
      outstandingBalance,
    };
  }, [clientInvoicesData]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Failed to load invoice</div>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'VOIDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Invoices
        </button>
      </div>

      {/* Voided Alert */}
      {invoice?.status === 'VOIDED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-red-900 mb-2">Invoice Voided</h4>
          <div className="text-sm text-red-700 space-y-1">
            <div>Voided on: {format(new Date(invoice.voidedAt!), 'PPP')}</div>
            {invoice.voider && <div>Voided by: {invoice.voider.name}</div>}
            <div className="mt-2">
              <strong>Reason:</strong> {invoice.voidReason}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${invoice.status === 'VOIDED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {invoice.invoiceNumber}
            </h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {canReturn && (
              <button
                onClick={() => navigate(`/returns/create/${invoice.id}`)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Create Return
              </button>
            )}
            {canVoid && (
              <button
                onClick={() => setShowVoidModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Void Invoice
              </button>
            )}
            <div className="text-right">
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm font-medium">{format(new Date(invoice.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client */}
          <div className="flex items-start gap-3">
            <Building2 className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p className="font-semibold text-gray-900">{invoice.client.name}</p>
              {invoice.client.city && <p className="text-sm text-gray-600">{invoice.client.city}</p>}
            </div>
          </div>

          {/* Warehouse */}
          <div className="flex items-start gap-3">
            <MapPin className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Warehouse</p>
              <p className="font-semibold text-gray-900">{invoice.warehouse.name}</p>
            </div>
          </div>

          {/* Invoice Date */}
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-semibold text-gray-900">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-semibold text-gray-900">{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</p>
            </div>
          </div>

          {/* Payment Type */}
          <div className="flex items-start gap-3">
            <CreditCard className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Payment Type</p>
              <p className="font-semibold text-gray-900">{invoice.paymentType}</p>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="flex items-start gap-3 md:col-span-2">
              <FileText className="text-gray-400 mt-1" size={20} />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Invoice Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Batch</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Discount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    {item.productVariant && (
                      <div className="text-xs text-gray-500">{item.productVariant.variantName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {item.productVariant?.sku || item.product.sku}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.batchNo || 'N/A'}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">
                    PKR {Number(item.unitPrice).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-900">{item.discount}%</td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    PKR {Number(item.total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">PKR {Number(invoice.subtotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax:</span>
            <span className="font-medium">PKR {Number(invoice.taxAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
            <span>Total:</span>
            <span>PKR {Number(invoice.total).toLocaleString()}</span>
          </div>
          {invoice.paymentType === 'CREDIT' && (
            <>
              <div className="flex justify-between text-gray-700 pt-2 border-t">
                <span>Paid Amount:</span>
                <span className="font-medium text-green-600">PKR {Number(invoice.paidAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Balance Due:</span>
                <span className="font-medium text-red-600">
                  PKR {(Number(invoice.total) - Number(invoice.paidAmount)).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Client Credit History Section - For PDF/Print */}
      {creditHistory && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">
            Client Credit History - {invoice.client.name}
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Total Credit</p>
              <p className="text-2xl font-bold text-blue-900">
                PKR {creditHistory.totalCredit.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">
                PKR {creditHistory.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 mb-1">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-900">
                PKR {creditHistory.outstandingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Invoice Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-2 px-3">Invoice #</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-right py-2 px-3">Total</th>
                  <th className="text-right py-2 px-3">Paid</th>
                  <th className="text-right py-2 px-3">Balance</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {creditHistory.invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`${inv.id === invoice.id ? 'bg-yellow-50' : ''} ${
                      inv.status === 'VOIDED' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className={`py-2 px-3 font-medium ${inv.status === 'VOIDED' ? 'line-through' : ''}`}>
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2 px-3">
                      {format(new Date(inv.invoiceDate), 'dd MMM yyyy')}
                    </td>
                    <td className="py-2 px-3 text-right">
                      PKR {Number(inv.total).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">
                      PKR {Number(inv.paidAmount).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-red-600">
                      PKR {(Number(inv.total) - Number(inv.paidAmount)).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 font-bold">
                <tr>
                  <td colSpan={2} className="py-2 px-3">
                    TOTALS (excluding voided)
                  </td>
                  <td className="py-2 px-3 text-right">
                    PKR {creditHistory.totalCredit.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-green-600">
                    PKR {creditHistory.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-red-600">
                    PKR {creditHistory.outstandingBalance.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Void Invoice Modal */}
      {showVoidModal && invoice && (
        <VoidInvoiceModal
          invoice={invoice}
          isOpen={showVoidModal}
          onClose={() => setShowVoidModal(false)}
          onConfirm={handleVoidConfirm}
          isLoading={voidMutation.isPending}
        />
      )}
    </div>
  );
}
