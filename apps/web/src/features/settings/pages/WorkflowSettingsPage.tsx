import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs, Spinner } from '../../../components/ui';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth.store';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface WorkflowSettings {
  'sales.requireSalesOrder': boolean;
  'sales.requireDeliveryNote': boolean;
  'sales.allowDirectInvoice': boolean;
  'purchasing.requirePurchaseInvoice': boolean;
  'sales.enableStockReservation': boolean;
}

function useWorkflowSettings() {
  return useQuery({
    queryKey: ['workflow-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: WorkflowSettings }>(
        '/settings/workflow'
      );
      return data.data;
    },
  });
}

function useUpdateWorkflowSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { data } = await apiClient.put('/settings/workflow', { key, value });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-settings'] });
      toast.success('Setting updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update setting');
    },
  });
}

const SETTING_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  'sales.requireSalesOrder': {
    label: 'Require Sales Order',
    description:
      'When enabled, invoices must be created from a confirmed Sales Order. Disabling allows direct invoice creation without a Sales Order.',
  },
  'sales.requireDeliveryNote': {
    label: 'Require Delivery Note',
    description:
      'When enabled, stock deduction happens at Delivery Note dispatch (not at Invoice). The flow becomes: Sales Order → Delivery Note → Invoice. COGS is posted when DN is dispatched.',
  },
  'sales.allowDirectInvoice': {
    label: 'Allow Direct Invoice',
    description:
      'When enabled, invoices can be created directly without a Sales Order or Delivery Note. This is the traditional simple mode.',
  },
  'purchasing.requirePurchaseInvoice': {
    label: 'Require Purchase Invoice',
    description:
      'When enabled, supplier payments require a Purchase Invoice for 3-way matching (PO → GRN → PI).',
  },
  'sales.enableStockReservation': {
    label: 'Enable Stock Reservation',
    description:
      'When enabled, confirming a Sales Order reserves stock for the order. Reserved stock cannot be allocated to other orders.',
  },
};

export const WorkflowSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.name === 'ADMIN';
  const { data: settings, isLoading } = useWorkflowSettings();
  const updateMutation = useUpdateWorkflowSetting();

  const handleToggle = (key: string, currentValue: boolean) => {
    if (!isAdmin) {
      toast.error('Only Admin users can change workflow settings');
      return;
    }
    updateMutation.mutate({ key, value: !currentValue });
  };

  if (isLoading) {
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
          { label: 'Settings', href: '/settings/tax' },
          { label: 'Workflow Settings' },
        ]}
        className="mb-4"
      />

      <h1 className="text-2xl font-bold text-gray-900">Workflow Settings</h1>
      <p className="text-sm text-gray-500">
        Configure how sales, purchasing, and inventory workflows operate in your system.
      </p>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-amber-800 font-medium">Important</p>
          <p className="text-amber-700 text-sm">
            Changing these settings affects how invoices, stock movements, and accounting entries are
            processed. Changes apply to new transactions only — existing documents are not affected.
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {/* Sales Workflow Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Sales Workflow</h2>
            <p className="text-sm text-gray-500">
              Control the sales document chain: Sales Order → Delivery Note → Invoice
            </p>
          </div>
          <div className="divide-y">
            {['sales.requireSalesOrder', 'sales.requireDeliveryNote', 'sales.allowDirectInvoice', 'sales.enableStockReservation'].map(
              (key) => {
                const info = SETTING_DESCRIPTIONS[key];
                const value = settings?.[key as keyof WorkflowSettings] ?? false;
                return (
                  <div key={key} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{info.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(key, value)}
                      disabled={updateMutation.isPending || !isAdmin}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Purchasing Workflow Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Purchasing Workflow</h2>
            <p className="text-sm text-gray-500">
              Control the purchasing document chain: Purchase Order → GRN → Purchase Invoice
            </p>
          </div>
          <div className="divide-y">
            {['purchasing.requirePurchaseInvoice'].map((key) => {
              const info = SETTING_DESCRIPTIONS[key];
              const value = settings?.[key as keyof WorkflowSettings] ?? false;
              return (
                <div key={key} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{info.label}</p>
                    <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key, value)}
                    disabled={updateMutation.isPending || !isAdmin}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      value ? 'bg-blue-600' : 'bg-gray-200'
                    } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Mode Indicator */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Mode</h2>
          {settings?.['sales.requireDeliveryNote'] ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <div>
                <p className="font-medium text-blue-900">Full Mode</p>
                <p className="text-sm text-blue-700">
                  Sales Order → Delivery Note (stock deduction) → Invoice (revenue only)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <p className="font-medium text-green-900">Simple Mode</p>
                <p className="text-sm text-green-700">
                  Invoice → Stock deduction + Revenue + COGS (all at once)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
