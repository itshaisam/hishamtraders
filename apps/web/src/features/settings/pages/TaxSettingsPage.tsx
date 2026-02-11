import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useGetTaxRate, useUpdateTaxRate, useCurrencySymbol, useUpdateCurrencySymbol } from '../../../hooks/useSettings';
import { useAuthStore } from '../../../stores/auth.store';
import { formatCurrency, formatCurrencyCompact } from '../../../lib/formatCurrency';

export function TaxSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: taxData, isLoading: taxLoading, isError: taxError } = useGetTaxRate();
  const updateTaxRate = useUpdateTaxRate();
  const { data: currencyData, isLoading: currencyLoading, isError: currencyError } = useCurrencySymbol();
  const updateCurrencySymbol = useUpdateCurrencySymbol();
  const [taxRate, setTaxRate] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');

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

  const rateValue = parseFloat(taxRate);
  const isTaxValid = !isNaN(rateValue) && rateValue >= 0 && rateValue <= 100;
  const isCurrencyValid = symbol.trim().length > 0 && symbol.trim().length <= 10;

  const isLoading = taxLoading || currencyLoading;
  const isError = taxError || currencyError;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure tax rate, currency, and other system-wide settings</p>
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
                    step="0.1"
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
