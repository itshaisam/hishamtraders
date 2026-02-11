import { Client } from '../../../types/client.types';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface CreditUtilizationDisplayProps {
  client: Client;
}

export function CreditUtilizationDisplay({ client }: CreditUtilizationDisplayProps) {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const balance = Number(client.balance);
  const creditLimit = Number(client.creditLimit);
  const utilization = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;

  const getColor = () => {
    if (utilization >= 100) return 'bg-red-600';
    if (utilization >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (utilization >= 100) return 'text-red-700';
    if (utilization >= 80) return 'text-yellow-700';
    return 'text-green-700';
  };

  const getStatusText = () => {
    if (utilization >= 100) return 'Exceeded';
    if (utilization >= 80) return 'Warning';
    return 'Good';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">Credit Utilization</h3>
          <span className={`text-sm font-semibold ${getTextColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Utilization</span>
            <span className={`font-semibold ${getTextColor()}`}>
              {utilization.toFixed(1)}%
            </span>
          </div>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getColor()}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Current Balance</p>
            <p className="text-sm font-semibold text-gray-800">
              {cs} {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Credit Limit</p>
            <p className="text-sm font-semibold text-gray-800">
              {cs} {creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {utilization >= 80 && (
          <div className={`mt-2 p-2 rounded-md text-xs ${
            utilization >= 100 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            {utilization >= 100
              ? '⚠️ Credit limit exceeded. Payment or credit increase required.'
              : '⚠️ Approaching credit limit. Monitor closely.'}
          </div>
        )}
      </div>
    </div>
  );
}
