import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useGetTaxRate, useUpdateTaxRate } from '../../../hooks/useSettings';
import { useAuthStore } from '../../../stores/auth.store';

export function TaxSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useGetTaxRate();
  const updateTaxRate = useUpdateTaxRate();
  const [taxRate, setTaxRate] = useState<string>('');

  // Redirect non-admin users
  if (user?.role?.name !== 'ADMIN') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  useEffect(() => {
    if (data?.taxRate !== undefined) {
      setTaxRate(String(data.taxRate));
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    updateTaxRate.mutate(rate);
  };

  const rateValue = parseFloat(taxRate);
  const isValid = !isNaN(rateValue) && rateValue >= 0 && rateValue <= 100;

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
        <h1 className="text-3xl font-bold text-gray-900">Tax Settings</h1>
        <p className="text-gray-500 mt-1">Configure the sales tax rate applied to invoices</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load tax rate settings.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    !isValid && taxRate !== ''
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <span className="text-gray-500 text-lg">%</span>
              </div>
              {!isValid && taxRate !== '' && (
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
                disabled={!isValid || updateTaxRate.isPending || taxRate === ''}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updateTaxRate.isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {updateTaxRate.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
