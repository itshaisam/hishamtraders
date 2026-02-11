import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, RotateCcw } from 'lucide-react';
import { useCreditNotes } from '../../../hooks/useCreditNotes';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { CreditNoteFilters, CreditNoteStatus } from '../../../types/credit-note.types';

export function ReturnsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CreditNoteFilters>({ page: 1, limit: 20 });
  const { data, isLoading } = useCreditNotes(filters);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Returns / Credit Notes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage product returns and credit notes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({ ...filters, status: (e.target.value || undefined) as CreditNoteStatus | undefined, page: 1 })
              }
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="APPLIED">Applied</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ page: 1, limit: 20 })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading credit notes...</div>
        ) : !data?.data?.length ? (
          <div className="p-8 text-center text-gray-500">
            <RotateCcw className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No credit notes found</p>
            <p className="text-sm mt-1">
              Create a return from an invoice's detail page
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">CN #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created By</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((cn) => (
                    <tr key={cn.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-blue-600">
                        {cn.creditNoteNumber}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <button
                          onClick={() => navigate(`/invoices/${cn.invoiceId}`)}
                          className="text-blue-600 hover:underline"
                        >
                          {cn.invoice?.invoiceNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{cn.client?.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(cn.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                        {cs} {Number(cn.totalAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(cn.status)}`}
                        >
                          {cn.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{cn.creator?.name}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigate(`/returns/${cn.id}`)}
                          className="text-gray-600 hover:text-blue-600 p-1"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-600">
                  Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={data.pagination.page <= 1}
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
