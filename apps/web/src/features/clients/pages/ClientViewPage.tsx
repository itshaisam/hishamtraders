import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Phone, Mail, MapPin, User, RotateCcw, MessageCircle } from 'lucide-react';
import { useClient } from '../../../hooks/useClients';
import { useCreditNotes } from '../../../hooks/useCreditNotes';
import { ClientPaymentHistory } from '../components/ClientPaymentHistory';
import { Button, Breadcrumbs } from '../../../components/ui';
import { format } from 'date-fns';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrency } from '../../../lib/formatCurrency';

export const ClientViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: response, isLoading, isError } = useClient(id || '');
  const client = response?.data;
  const { data: creditNotesData } = useCreditNotes(id ? { clientId: id, limit: 50 } : undefined);

  if (isLoading) {
    return (
      <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading customer...</p>
          </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Customer Not Found</h2>
            <p className="text-red-700 mb-4">The customer you're looking for doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={() => navigate('/clients')}>
              Back to Customers
            </Button>
          </div>
      </div>
    );
  }

  const balance = Number(client.balance);
  const creditLimit = Number(client.creditLimit);
  const utilization = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;
  const creditStatus = utilization >= 100 ? 'danger' : utilization >= 80 ? 'warning' : 'good';

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'VOIDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Sales', href: '/invoices' },
            { label: 'Customers', href: '/clients' },
            { label: client.name },
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/clients')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-700" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{client.name}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(client.status)}`}>
                  {client.status}
                </span>
              </div>
              {client.contactPerson && (
                <p className="text-sm text-gray-600 mt-1">{client.contactPerson}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/clients/${id}`)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Link
              to={`/payments/client/record/${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Record Payment
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Phone size={16} />
              <span className="text-xs uppercase font-medium">Phone</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{client.phone || '-'}</p>
            {client.whatsapp && (
              <a
                href={`https://wa.me/${client.whatsapp.replace(/\+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Mail size={16} />
              <span className="text-xs uppercase font-medium">Email</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{client.email || '-'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MapPin size={16} />
              <span className="text-xs uppercase font-medium">Location</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {[client.area, client.city].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <User size={16} />
              <span className="text-xs uppercase font-medium">Payment Terms</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{client.paymentTermsDays} days</p>
          </div>
        </div>

        {/* Credit Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Credit Limit</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(creditLimit, cs)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(balance, cs)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Credit Utilization</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      creditStatus === 'good' ? 'bg-green-500' :
                      creditStatus === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${
                  creditStatus === 'good' ? 'text-green-600' :
                  creditStatus === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {utilization.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {client.invoices && client.invoices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-2 px-3">Invoice #</th>
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Due Date</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="text-right py-2 px-3">Paid</th>
                    <th className="text-right py-2 px-3">Balance</th>
                    <th className="text-center py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {client.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {format(new Date(inv.invoiceDate), 'dd MMM yyyy')}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatCurrency(Number(inv.total), cs)}
                      </td>
                      <td className="py-2 px-3 text-right text-green-600">
                        {formatCurrency(Number(inv.paidAmount), cs)}
                      </td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(Number(inv.total) - Number(inv.paidAmount), cs)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getInvoiceStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>
          <ClientPaymentHistory clientId={id!} />
        </div>

        {/* Credit Notes */}
        {creditNotesData?.data && creditNotesData.data.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-gray-500" />
                Credit Notes
              </h2>
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
        )}
    </div>
  );
};
