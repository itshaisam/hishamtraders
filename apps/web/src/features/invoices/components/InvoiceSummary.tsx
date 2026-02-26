import { useCurrencySymbol } from '../../../hooks/useSettings';
import { formatCurrencyDecimal } from '../../../lib/formatCurrency';

interface InvoiceSummaryProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate?: number;
  onTaxRateChange?: (rate: number) => void;
}

export function InvoiceSummary({ subtotal, taxAmount, total, taxRate, onTaxRateChange }: InvoiceSummaryProps) {
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
        <div className="flex justify-between items-center text-gray-700">
          <span className="flex items-center gap-2">
            Tax:
            {onTaxRateChange ? (
              <>
                <input
                  type="number"
                  value={taxRate ?? 18}
                  onChange={(e) => onTaxRateChange(Math.max(0, Math.min(100, Number(e.target.value))))}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </>
            ) : (
              <span>({taxRate ?? 18}%)</span>
            )}
          </span>
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
