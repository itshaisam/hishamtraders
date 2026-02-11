import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';

interface InvoiceSummaryProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate?: number;
}

export function InvoiceSummary({ subtotal, taxAmount, total, taxRate }: InvoiceSummaryProps) {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Summary</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span className="font-medium">
            {formatCurrencyDecimal(subtotal, cs)}
          </span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Tax ({taxRate ?? 18}%):</span>
          <span className="font-medium">
            {formatCurrencyDecimal(taxAmount, cs)}
          </span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
          <span>Total:</span>
          <span>{formatCurrencyDecimal(total, cs)}</span>
        </div>
      </div>
    </div>
  );
}
