import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { useCreditNote } from '../../../hooks/useCreditNotes';

export function CreditNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: creditNote, isLoading, error } = useCreditNote(id!);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'APPLIED':
        return 'bg-green-100 text-green-800';
      case 'VOIDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading credit note...</div>
      </div>
    );
  }

  if (error || !creditNote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Failed to load credit note</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/returns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Returns
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {creditNote.creditNoteNumber}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(creditNote.status)}`}
            >
              {creditNote.status}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Created</p>
            <p className="text-sm font-medium">
              {format(new Date(creditNote.createdAt), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <FileText className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Invoice</p>
              <button
                onClick={() => navigate(`/invoices/${creditNote.invoiceId}`)}
                className="font-semibold text-blue-600 hover:underline"
              >
                {creditNote.invoice.invoiceNumber}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <button
                onClick={() => navigate(`/clients/${creditNote.clientId}`)}
                className="font-semibold text-blue-600 hover:underline"
              >
                {creditNote.client.name}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Created By</p>
              <p className="font-semibold text-gray-900">{creditNote.creator.name}</p>
              <p className="text-xs text-gray-500">{creditNote.creator.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(creditNote.createdAt), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Return Reason</p>
          <p className="text-gray-900">{creditNote.reason}</p>
        </div>
      </div>

      {/* Returned Items */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Returned Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Batch</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Qty Returned</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Unit Price</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Discount</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {creditNote.items.map((item) => (
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
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    {item.quantityReturned}
                  </td>
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

      {/* Credit Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">PKR {Number(creditNote.subtotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax ({Number(creditNote.taxRate)}%):</span>
            <span className="font-medium">PKR {Number(creditNote.taxAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-green-700 pt-3 border-t">
            <span>Total Credit:</span>
            <span>PKR {Number(creditNote.totalAmount).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
