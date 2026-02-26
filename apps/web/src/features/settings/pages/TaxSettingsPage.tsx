import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Loader2, Building2, Receipt, GitBranch, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useGetTaxRate, useUpdateTaxRate,
  useGetPurchaseTaxRate, useUpdatePurchaseTaxRate,
  useCurrencySymbol, useUpdateCurrencySymbol,
  useCompanyName, useUpdateCompanyName,
  useCompanyLogo, useUpdateCompanyLogo,
} from '../../../hooks/useSettings';
import { useAuthStore } from '../../../stores/auth.store';
import { formatCurrency, formatCurrencyCompact } from '../../../lib/formatCurrency';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { apiClient } from '../../../lib/api-client';

interface WorkflowSettings {
  'sales.requireSalesOrder': boolean;
  'sales.requireDeliveryNote': boolean;
  'sales.allowDirectInvoice': boolean;
  'purchasing.requirePurchaseInvoice': boolean;
  'sales.enableStockReservation': boolean;
}

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'tax', label: 'Tax', icon: Receipt },
  { id: 'workflow', label: 'Workflow', icon: GitBranch },
] as const;

type TabId = typeof TABS[number]['id'];

const WORKFLOW_SETTING_DESCRIPTIONS: Record<string, { label: string; description: string; group: string }> = {
  'sales.requireSalesOrder': {
    label: 'Require Sales Order',
    description: 'When enabled, invoices must be created from a confirmed Sales Order. Disabling allows direct invoice creation.',
    group: 'Sales Workflow',
  },
  'sales.requireDeliveryNote': {
    label: 'Require Delivery Note',
    description: 'When enabled, stock deduction happens at Delivery Note dispatch (not at Invoice). Flow: SO \u2192 DN \u2192 Invoice.',
    group: 'Sales Workflow',
  },
  'sales.allowDirectInvoice': {
    label: 'Allow Direct Invoice',
    description: 'When enabled, invoices can be created without a Sales Order or Delivery Note (traditional simple mode).',
    group: 'Sales Workflow',
  },
  'sales.enableStockReservation': {
    label: 'Enable Stock Reservation',
    description: 'When enabled, confirming a Sales Order reserves stock. (Coming soon \u2014 not yet enforced)',
    group: 'Sales Workflow',
  },
  'purchasing.requirePurchaseInvoice': {
    label: 'Require Purchase Invoice',
    description: 'When enabled, supplier payments require a Purchase Invoice reference for 3-way matching (PO \u2192 GRN \u2192 PI).',
    group: 'Purchasing Workflow',
  },
};

export function TaxSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Redirect non-admin users
  if (user?.role?.name !== 'ADMIN') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const initialTab = (searchParams.get('tab') as TabId) || 'general';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams(tab === 'general' ? {} : { tab });
  };

  // ===== General tab hooks =====
  const { data: companyNameData, isLoading: nameLoading } = useCompanyName();
  const updateCompanyName = useUpdateCompanyName();
  const { data: companyLogoData, isLoading: logoLoading } = useCompanyLogo();
  const updateCompanyLogo = useUpdateCompanyLogo();
  const { data: currencyData, isLoading: currencyLoading } = useCurrencySymbol();
  const updateCurrencySymbol = useUpdateCurrencySymbol();

  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [symbol, setSymbol] = useState('');

  useEffect(() => { if (companyNameData?.companyName !== undefined) setCompanyName(companyNameData.companyName); }, [companyNameData]);
  useEffect(() => { if (companyLogoData?.companyLogo !== undefined) setCompanyLogo(companyLogoData.companyLogo); }, [companyLogoData]);
  useEffect(() => { if (currencyData?.currencySymbol !== undefined) setSymbol(currencyData.currencySymbol); }, [currencyData]);

  // ===== Tax tab hooks =====
  const { data: taxData, isLoading: taxLoading } = useGetTaxRate();
  const updateTaxRate = useUpdateTaxRate();
  const { data: purchaseTaxData, isLoading: purchaseTaxLoading } = useGetPurchaseTaxRate();
  const updatePurchaseTaxRate = useUpdatePurchaseTaxRate();

  const [taxRate, setTaxRate] = useState('');
  const [purchaseTaxRate, setPurchaseTaxRate] = useState('');

  useEffect(() => { if (taxData?.taxRate !== undefined) setTaxRate(String(taxData.taxRate)); }, [taxData]);
  useEffect(() => { if (purchaseTaxData?.purchaseTaxRate !== undefined) setPurchaseTaxRate(String(purchaseTaxData.purchaseTaxRate)); }, [purchaseTaxData]);

  // ===== Workflow tab hooks =====
  const { data: workflowSettings, isLoading: workflowLoading } = useQuery<WorkflowSettings>({
    queryKey: ['workflow-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: WorkflowSettings }>('/settings/workflow');
      return data.data;
    },
  });

  const updateWorkflow = useMutation({
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

  const handleToggle = (key: string, currentValue: boolean) => {
    updateWorkflow.mutate({ key, value: !currentValue });
  };

  // Validation
  const rateValue = parseFloat(taxRate);
  const isTaxValid = !isNaN(rateValue) && rateValue >= 0 && rateValue <= 100;
  const purchaseRateValue = parseFloat(purchaseTaxRate);
  const isPurchaseTaxValid = !isNaN(purchaseRateValue) && purchaseRateValue >= 0 && purchaseRateValue <= 100;
  const isCurrencyValid = symbol.trim().length > 0 && symbol.trim().length <= 10;

  const isLoading = nameLoading || logoLoading || currencyLoading || taxLoading || purchaseTaxLoading || workflowLoading;

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Settings' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure company info, tax rates, currency, and workflow settings</p>
      </div>

      {/* Tab Buttons */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {/* ===== General Tab ===== */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              {/* Company Name */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <form onSubmit={(e) => { e.preventDefault(); if (companyName.trim()) updateCompanyName.mutate(companyName.trim()); }} className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Hisham Traders" />
                    <p className="text-gray-400 text-sm mt-1">Displayed on invoices and printed documents.</p>
                  </div>
                  <button type="submit" disabled={!companyName.trim() || updateCompanyName.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {updateCompanyName.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {updateCompanyName.isPending ? 'Saving...' : 'Save'}
                  </button>
                </form>

                {/* Company Logo */}
                <form onSubmit={(e) => { e.preventDefault(); updateCompanyLogo.mutate(companyLogo.trim()); }} className="space-y-4 pt-6 border-t">
                  <div>
                    <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 mb-1">Company Logo URL</label>
                    <input id="companyLogo" type="text" value={companyLogo} onChange={(e) => setCompanyLogo(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/logo.png (leave empty for none)" />
                    <p className="text-gray-400 text-sm mt-1">URL to your company logo. Displayed on printed invoices.</p>
                  </div>
                  {companyLogo.trim() && (
                    <div className="bg-gray-50 rounded-md p-4 max-w-md">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                      <img src={companyLogo.trim()} alt="Company logo preview" className="max-h-16 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <button type="submit" disabled={updateCompanyLogo.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {updateCompanyLogo.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {updateCompanyLogo.isPending ? 'Saving...' : 'Save'}
                  </button>
                </form>
              </div>

              {/* Currency */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency</h2>
                <form onSubmit={(e) => { e.preventDefault(); if (isCurrencyValid) updateCurrencySymbol.mutate(symbol.trim()); }} className="space-y-4">
                  <div>
                    <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                    <input id="currencySymbol" type="text" maxLength={10} value={symbol} onChange={(e) => setSymbol(e.target.value)}
                      className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${!isCurrencyValid && symbol !== '' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="PKR" />
                    {!isCurrencyValid && symbol !== '' && <p className="text-red-500 text-sm mt-1">Currency must be 1-10 characters</p>}
                    <p className="text-gray-400 text-sm mt-2">Displayed across all currency values (e.g. PKR, Rs, USD).</p>
                  </div>
                  {isCurrencyValid && (
                    <div className="bg-gray-50 rounded-md p-4 max-w-md">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Full: <span className="font-mono font-medium text-gray-900">{formatCurrency(1234567, symbol.trim())}</span></p>
                        <p>Compact: <span className="font-mono font-medium text-gray-900">{formatCurrencyCompact(1500000, symbol.trim())}</span></p>
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={!isCurrencyValid || updateCurrencySymbol.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {updateCurrencySymbol.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {updateCurrencySymbol.isPending ? 'Saving...' : 'Save'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ===== Tax Tab ===== */}
          {activeTab === 'tax' && (
            <div className="space-y-8">
              {/* Sales Tax Rate */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Sales Tax Rate</h2>
                <p className="text-sm text-gray-500 mb-4">Applied to sales invoices. Posted to account 2200 (Tax Payable).</p>
                <form onSubmit={(e) => { e.preventDefault(); const rate = parseFloat(taxRate); if (!isNaN(rate) && rate >= 0 && rate <= 100) updateTaxRate.mutate(rate); }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input id="taxRate" type="number" min="0" max="100" step="0.0001" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                      className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${!isTaxValid && taxRate !== '' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} />
                    <span className="text-gray-500 text-lg">%</span>
                  </div>
                  {!isTaxValid && taxRate !== '' && <p className="text-red-500 text-sm">Tax rate must be between 0 and 100</p>}
                  <button type="submit" disabled={!isTaxValid || updateTaxRate.isPending || taxRate === ''}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {updateTaxRate.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {updateTaxRate.isPending ? 'Saving...' : 'Save Sales Tax Rate'}
                  </button>
                </form>
              </div>

              {/* Purchase Tax Rate */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Purchase Tax Rate</h2>
                <p className="text-sm text-gray-500 mb-4">Applied to purchase orders. Posted to account 1350 (Input Tax Receivable) — this is tax the government owes you.</p>
                <form onSubmit={(e) => { e.preventDefault(); const rate = parseFloat(purchaseTaxRate); if (!isNaN(rate) && rate >= 0 && rate <= 100) updatePurchaseTaxRate.mutate(rate); }} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input id="purchaseTaxRate" type="number" min="0" max="100" step="0.0001" value={purchaseTaxRate} onChange={(e) => setPurchaseTaxRate(e.target.value)}
                      className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${!isPurchaseTaxValid && purchaseTaxRate !== '' ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} />
                    <span className="text-gray-500 text-lg">%</span>
                  </div>
                  {!isPurchaseTaxValid && purchaseTaxRate !== '' && <p className="text-red-500 text-sm">Tax rate must be between 0 and 100</p>}
                  <button type="submit" disabled={!isPurchaseTaxValid || updatePurchaseTaxRate.isPending || purchaseTaxRate === ''}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {updatePurchaseTaxRate.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {updatePurchaseTaxRate.isPending ? 'Saving...' : 'Save Purchase Tax Rate'}
                  </button>
                </form>
              </div>

              {/* Tax Account Summary */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">2200</span>
                    <div>
                      <p className="font-medium text-gray-900">Tax Payable (Output Tax)</p>
                      <p className="text-gray-500">Sales tax you collect from customers and owe to the government</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-1 rounded">1350</span>
                    <div>
                      <p className="font-medium text-gray-900">Input Tax Receivable</p>
                      <p className="text-gray-500">Purchase tax paid to suppliers that the government owes you</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== Workflow Tab ===== */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
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

              {/* Group by Sales / Purchasing */}
              {['Sales Workflow', 'Purchasing Workflow'].map((group) => {
                const groupKeys = Object.entries(WORKFLOW_SETTING_DESCRIPTIONS).filter(([, v]) => v.group === group);
                return (
                  <div key={group} className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-semibold text-gray-900">{group}</h2>
                    </div>
                    <div className="divide-y">
                      {groupKeys.map(([key, info]) => {
                        const value = workflowSettings?.[key as keyof WorkflowSettings] ?? false;
                        return (
                          <div key={key} className="px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{info.label}</p>
                              <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                            </div>
                            <button
                              onClick={() => handleToggle(key, value)}
                              disabled={updateWorkflow.isPending}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                value ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Current Mode Indicator */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Mode</h2>
                {workflowSettings?.['sales.requireDeliveryNote'] ? (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div>
                      <p className="font-medium text-blue-900">Full Mode</p>
                      <p className="text-sm text-blue-700">Sales Order \u2192 Delivery Note (stock deduction) \u2192 Invoice (revenue only)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="font-medium text-green-900">Simple Mode</p>
                      <p className="text-sm text-green-700">Invoice \u2192 Stock deduction + Revenue + COGS (all at once)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
