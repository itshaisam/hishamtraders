import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ClientForm } from '../components/ClientForm';
import { useCreateClient } from '../../../hooks/useClients';
import { Breadcrumbs } from '../../../components/ui';

/**
 * ClientFormPage - Full page for creating a new client
 */
export const ClientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createClient, isPending } = useCreateClient();

  const handleSubmit = async (data: any) => {
    createClient(data, {
      onSuccess: () => {
        navigate('/clients');
      },
    });
  };

  return (
    <div className="p-6">
      {/* Breadcrumbs - Responsive */}
      <Breadcrumbs
        items={[
          { label: 'Sales', href: '/invoices' },
          { label: 'Customers', href: '/clients' },
          { label: 'Create New Customer' },
        ]}
        className="mb-4"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Customer</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Add a new customer to your system. All required fields must be filled.
          </p>
        </div>
      </div>

      {/* Form Card - Full width on mobile, wider on desktop */}
      <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2">
        <ClientForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </div>
  );
};
