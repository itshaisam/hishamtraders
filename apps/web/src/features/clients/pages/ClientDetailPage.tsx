import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, RotateCcw, History } from 'lucide-react';
import { ClientForm } from '../components/ClientForm';
import { CreditUtilizationDisplay } from '../components/CreditUtilizationDisplay';
import { ClientPaymentHistory } from '../components/ClientPaymentHistory';
import { useClient, useUpdateClient } from '../../../hooks/useClients';
import { useCreditNotes } from '../../../hooks/useCreditNotes';
import { Button, Breadcrumbs } from '../../../components/ui';
import { ChangeHistoryModal } from '../../../components/ChangeHistoryModal';
import { format } from 'date-fns';
import { useCurrencySymbol } from '../../../hooks/useSettings';

/**
 * ClientDetailPage - Full page for editing an existing client
 */
export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: response, isLoading, isError } = useClient(id || '');
  const { mutate: updateClient, isPending: isUpdating } = useUpdateClient();

  // Extract client data from API response
  const client = response?.data;
  const [showHistory, setShowHistory] = useState(false);
  const { data: creditNotesData } = useCreditNotes(id ? { clientId: id, limit: 10 } : undefined);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    updateClient(
      { id, data },
      {
        onSuccess: () => {
          navigate('/clients');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading customer...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Customer Not Found</h2>
            <p className="text-red-700 mb-4">The customer you're looking for doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={() => navigate('/clients')}>
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-4">
        {/* Breadcrumbs - Responsive */}
        <Breadcrumbs
          items={[
            { label: 'Customers', href: '/clients' },
            { label: client.name },
          ]}
          className="text-xs sm:text-sm"
        />

        {/* Header with back button - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to customers"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Customer</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Update customer information and details</p>
          </div>
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
            <History size={16} />
            History
          </button>
        </div>

        {/* Credit Utilization & Form - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credit Utilization - Sidebar */}
          <div className="lg:col-span-1">
            <CreditUtilizationDisplay client={client} />
          </div>

          {/* Form Card - Main Content */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 md:p-8">
            <ClientForm client={client} onSubmit={handleSubmit} isLoading={isUpdating} />
          </div>
        </div>

        {/* Payment History Section - Story 3.6 Task 12 */}
        <hr className="my-6 border-gray-200" />

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
            <Link
              to={`/payments/client/record/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </Link>
          </div>
          <ClientPaymentHistory clientId={id!} />
        </div>

        {/* Credit Notes Section - Story 3.9 */}
        {creditNotesData?.data && creditNotesData.data.length > 0 && (
          <>
            <hr className="my-6 border-gray-200" />
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-gray-500" />
                  Credit Notes
                </h2>
                <Link
                  to="/returns"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-2 px-3">CN #</th>
                      <th className="text-left py-2 px-3">Invoice</th>
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-right py-2 px-3">Amount</th>
                      <th className="text-left py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {creditNotesData.data.map((cn) => (
                      <tr key={cn.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <Link to={`/returns/${cn.id}`} className="text-blue-600 hover:underline font-medium">
                            {cn.creditNoteNumber}
                          </Link>
                        </td>
                        <td className="py-2 px-3">
                          <Link to={`/invoices/${cn.invoiceId}`} className="text-blue-600 hover:underline">
                            {cn.invoice?.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {format(new Date(cn.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {cs} {Number(cn.totalAmount).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            cn.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                            cn.status === 'APPLIED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {cn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {id && (
        <ChangeHistoryModal
          entityType="CLIENT"
          entityId={id}
          currentData={client as any}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
