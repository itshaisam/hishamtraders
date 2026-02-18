import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react';
import {
  useGetTaxRate, useUpdateTaxRate,
  useCurrencySymbol, useUpdateCurrencySymbol,
  useCompanyName, useUpdateCompanyName,
  useCompanyLogo, useUpdateCompanyLogo,
} from '../../../hooks/useSettings';
import { useAuthStore } from '../../../stores/auth.store';
import { formatCurrency, formatCurrencyCompact } from '../../../lib/formatCurrency';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

export function TaxSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: taxData, isLoading: taxLoading, isError: taxError } = useGetTaxRate();
  const updateTaxRate = useUpdateTaxRate();
  const { data: currencyData, isLoading: currencyLoading, isError: currencyError } = useCurrencySymbol();
  const updateCurrencySymbol = useUpdateCurrencySymbol();
  const { data: companyNameData, isLoading: nameLoading } = useCompanyName();
  const updateCompanyName = useUpdateCompanyName();
  const { data: companyLogoData, isLoading: logoLoading } = useCompanyLogo();
  const updateCompanyLogo = useUpdateCompanyLogo();

  const [taxRate, setTaxRate] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('');

  // Redirect non-admin users
  if (user?.role?.name !== 'ADMIN') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  useEffect(() => {
    if (taxData?.taxRate !== undefined) {
      setTaxRate(String(taxData.taxRate));
    }
  }, [taxData]);

  useEffect(() => {
    if (currencyData?.currencySymbol !== undefined) {
      setSymbol(currencyData.currencySymbol);
    }
  }, [currencyData]);

  useEffect(() => {
    if (companyNameData?.companyName !== undefined) {
      setCompanyName(companyNameData.companyName);
    }
  }, [companyNameData]);

  useEffect(() => {
    if (companyLogoData?.companyLogo !== undefined) {
      setCompanyLogo(companyLogoData.companyLogo);
    }
  }, [companyLogoData]);

  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    updateTaxRate.mutate(rate);
  };

  const handleCurrencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || symbol.trim().length > 10) return;
    updateCurrencySymbol.mutate(symbol.trim());
  };

  const handleCompanyNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    updateCompanyName.mutate(companyName.trim());
  };

  const handleCompanyLogoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyLogo.mutate(companyLogo.trim());
  };

  const rateValue = parseFloat(taxRate);
  const isTaxValid = !isNaN(rateValue) && rateValue >= 0 && rateValue <= 100;
  const isCurrencyValid = symbol.trim().length > 0 && symbol.trim().length <= 10;

  const isLoading = taxLoading || currencyLoading || nameLoading || logoLoading;
  const isError = taxError || currencyError;

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Settings' }]} className="mb-4" />
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure company info, tax rate, currency, and other system-wide settings</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load settings.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
            </div>

            {/* Company Name */}
            <form onSubmit={handleCompanyNameSubmit} className="space-y-4 mb-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hisham Traders"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Displayed on invoices and printed documents.
                </p>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t">
                <button
                  type="submit"
                  disabled={!companyName.trim() || updateCompanyName.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updateCompanyName.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {updateCompanyName.isPending ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>

            {/* Company Logo URL */}
            <form onSubmit={handleCompanyLogoSubmit} className="space-y-4">
              <div>
                <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo URL
                </label>
                <input
                  id="companyLogo"
                  type="text"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png (leave empty for none)"
                />
                <p className="text-gray-400 text-sm mt-1">
                  URL to your company logo. Displayed on printed invoices.
                </p>
              </div>
              {companyLogo.trim() && (
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                  <img
                    src={companyLogo.trim()}
                    alt="Company logo preview"
                    className="max-h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex items-center gap-4 pt-3 border-t">
                <button
                  type="submit"
                  disabled={updateCompanyLogo.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updateCompanyLogo.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {updateCompanyLogo.isPending ? 'Saving...' : 'Save Logo'}
                </button>
              </div>
            </form>
          </div>

          {/* Tax Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Configuration</h2>
            <form onSubmit={handleTaxSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="taxRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sales Tax Rate (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.0001"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      !isTaxValid && taxRate !== ''
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <span className="text-gray-500 text-lg">%</span>
                </div>
                {!isTaxValid && taxRate !== '' && (
                  <p className="text-red-500 text-sm mt-1">
                    Tax rate must be between 0 and 100
                  </p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  This rate is applied automatically when creating new invoices.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={!isTaxValid || updateTaxRate.isPending || taxRate === ''}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updateTaxRate.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {updateTaxRate.isPending ? 'Saving...' : 'Save Tax Rate'}
                </button>
              </div>
            </form>
          </div>

          {/* Currency */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency</h2>
            <form onSubmit={handleCurrencySubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="currencySymbol"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Currency
                </label>
                <input
                  id="currencySymbol"
                  type="text"
                  maxLength={10}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className={`w-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    !isCurrencyValid && symbol !== ''
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="PKR"
                />
                {!isCurrencyValid && symbol !== '' && (
                  <p className="text-red-500 text-sm mt-1">
                    Currency must be 1-10 characters
                  </p>
                )}
                <p className="text-gray-400 text-sm mt-2">
                  This is displayed across all currency values in the system (e.g. PKR, Rs, USD).
                </p>
              </div>

              {/* Live Preview */}
              {isCurrencyValid && (
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Full: <span className="font-mono font-medium text-gray-900">{formatCurrency(1234567, symbol.trim())}</span></p>
                    <p>Compact: <span className="font-mono font-medium text-gray-900">{formatCurrencyCompact(1500000, symbol.trim())}</span></p>
                    <p>Small: <span className="font-mono font-medium text-gray-900">{formatCurrency(850, symbol.trim())}</span></p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={!isCurrencyValid || updateCurrencySymbol.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updateCurrencySymbol.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {updateCurrencySymbol.isPending ? 'Saving...' : 'Save Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
