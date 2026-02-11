import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface ClientWithUtilization {
  id: string;
  name: string;
  balance: number;
  creditLimit: number;
  city: string | null;
  phone: string | null;
  utilization: number;
  status: 'EXCEEDED' | 'WARNING';
}

export function CreditLimitAlerts() {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const [clients, setClients] = useState<ClientWithUtilization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/reports/credit-limits?threshold=80');
        setClients(response.data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching credit limit alerts:', err);
        setError('Failed to load credit limit alerts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditAlerts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={20} />
          Credit Limit Alerts
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={20} />
          Credit Limit Alerts
        </h2>
        <div className="text-center py-4 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            Credit Limit Alerts
          </h2>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {clients.length} Client{clients.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {clients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <TrendingUp className="mx-auto mb-2 text-green-500" size={32} />
            <p className="text-sm">All clients are within credit limits</p>
          </div>
        ) : (
          <>
            {clients.slice(0, 5).map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {client.name}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          client.status === 'EXCEEDED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {client.utilization.toFixed(0)}%
                      </span>
                    </div>
                    {client.city && (
                      <p className="text-xs text-gray-500 mt-0.5">{client.city}</p>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Balance:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {cs} {client.balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Limit:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {cs} {client.creditLimit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="text-gray-400 flex-shrink-0 mt-1" size={16} />
                </div>
              </Link>
            ))}

            {clients.length > 5 && (
              <div className="p-4 bg-gray-50 text-center">
                <Link
                  to="/reports/credit-limits"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all {clients.length} alerts
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
