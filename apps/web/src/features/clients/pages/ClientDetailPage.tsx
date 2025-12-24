import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ClientForm } from '../components/ClientForm';
import { useClient, useUpdateClient } from '../../../hooks/useClients';
import { Button, Breadcrumbs } from '../../../components/ui';

/**
 * ClientDetailPage - Full page for editing an existing client
 */
export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useClient(id || '');
  const { mutate: updateClient, isPending: isUpdating } = useUpdateClient();

  // Extract client data from API response
  const client = response?.data;

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
            <p className="mt-2 text-gray-600">Loading client...</p>
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
            <h2 className="text-lg font-semibold text-red-900 mb-2">Client Not Found</h2>
            <p className="text-red-700 mb-4">The client you're looking for doesn't exist or has been deleted.</p>
            <Button variant="primary" onClick={() => navigate('/clients')}>
              Back to Clients
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
            { label: 'Clients', href: '/clients' },
            { label: client.name },
          ]}
          className="text-xs sm:text-sm"
        />

        {/* Header with back button - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to clients"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Client</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Update client information and details</p>
          </div>
        </div>

        {/* Form Card - Full width on mobile, wider on desktop */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
          <ClientForm client={client} onSubmit={handleSubmit} isLoading={isUpdating} />
        </div>
      </div>
    </div>
  );
};
