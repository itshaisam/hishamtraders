import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { useClients, useCities, useDeleteClient } from '../../../hooks/useClients';
import { ClientStatus, Client } from '../../../types/client.types';
import { Button, Breadcrumbs } from '../../../components/ui';
import { useAuthStore } from '../../../stores/auth.store';
import { useCurrencySymbol } from '../../../hooks/useSettings';

export function ClientsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const canEdit = user?.role?.name && ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'].includes(user.role.name);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('');
  const [hasBalanceFilter, setHasBalanceFilter] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useClients({
    search,
    city: cityFilter || undefined,
    status: statusFilter || undefined,
    hasBalance: hasBalanceFilter,
    page,
    limit: 20,
  });

  const { data: citiesData } = useCities();
  const cities = citiesData?.data || [];

  const deleteMutation = useDeleteClient();

  const handleCreate = useCallback(() => {
    navigate('/clients/new');
  }, [navigate]);

  const handleEdit = useCallback((client: Client) => {
    navigate(`/clients/${client.id}`);
  }, [navigate]);

  const handleDelete = useCallback((client: Client) => {
    if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
      setDeletingId(client.id);
      deleteMutation.mutate(client.id, {
        onSettled: () => setDeletingId(null),
      });
    }
  }, [deleteMutation]);

  const getCreditStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'danger': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: ClientStatus) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  // Show loading skeleton
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Breadcrumbs - Responsive */}
        <Breadcrumbs
          items={[{ label: 'Customers' }]}
          className="text-xs sm:text-sm"
        />

        {/* Header - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Manage customer information and credit terms</p>
          </div>
          {canEdit && (
            <Button
              onClick={handleCreate}
              variant="primary"
              size="md"
              icon={<Plus size={20} />}
              className="w-full sm:w-auto"
            >
              New Customer
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 bg-white p-4 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ClientStatus | '');
                setPage(1);
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
            <label className="flex items-center gap-2 h-10">
              <input
                type="checkbox"
                checked={hasBalanceFilter}
                onChange={(e) => {
                  setHasBalanceFilter(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4"
              />
              <span className="text-sm">Has Balance</span>
            </label>
          </div>
        </div>

        {/* Table */}
        {data && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.data.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      {client.contactPerson && (
                        <div className="text-sm text-gray-500">{client.contactPerson}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {client.phone && <div>{client.phone}</div>}
                      {client.email && <div className="text-xs">{client.email}</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {client.city || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {cs} {client.creditLimit.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {cs} {client.balance.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {client.creditUtilization !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full ${
                                client.creditStatus === 'good' ? 'bg-green-600' :
                                client.creditStatus === 'warning' ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(client.creditUtilization, 100)}%` }}
                            />
                          </div>
                          <span className={`rounded px-2 py-1 text-xs font-medium ${getCreditStatusColor(client.creditStatus)}`}>
                            {client.creditUtilization.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusBadge(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => navigate(`/clients/${client.id}/view`)}
                        className="mr-2 text-gray-600 hover:text-gray-900"
                        title="View"
                      >
                        <Eye size={16} className="inline" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleEdit(client)}
                            className="mr-2 text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deletingId === client.id}
                          >
                            {deletingId === client.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {/* Pagination - Responsive Stack/Flex */}
            {data.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  Showing page {data.pagination.page} of {data.pagination.pages} (
                  {data.pagination.total} total)
                </p>
                <div className="flex gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={page === data.pagination.pages}
                    className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
