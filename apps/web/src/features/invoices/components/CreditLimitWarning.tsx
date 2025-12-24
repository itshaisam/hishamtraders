import { AlertTriangle } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface CreditLimitWarningProps {
  client: any;
  invoiceTotal: number;
  onOverrideChange: (enabled: boolean) => void;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export function CreditLimitWarning({
  client,
  invoiceTotal,
  onOverrideChange,
  register,
  errors,
}: CreditLimitWarningProps) {
  const currentBalance = Number(client.balance);
  const creditLimit = Number(client.creditLimit);
  const newBalance = currentBalance + invoiceTotal;
  const utilization = (newBalance / creditLimit) * 100;
  const isOverLimit = utilization > 100;

  return (
    <div className={`bg-yellow-50 border-l-4 ${isOverLimit ? 'border-red-500' : 'border-yellow-500'} p-4 rounded-lg shadow`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`${isOverLimit ? 'text-red-500' : 'text-yellow-500'} flex-shrink-0 mt-1`} size={24} />
        <div className="flex-1">
          <h3 className={`font-semibold ${isOverLimit ? 'text-red-800' : 'text-yellow-800'} mb-2`}>
            {isOverLimit ? 'Credit Limit Exceeded' : 'Approaching Credit Limit'}
          </h3>
          <div className="text-sm space-y-1 mb-3">
            <p className="text-gray-700">
              <span className="font-medium">Current Balance:</span> PKR {currentBalance.toLocaleString()}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Invoice Total:</span> PKR {invoiceTotal.toLocaleString()}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">New Balance:</span> PKR {newBalance.toLocaleString()}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Credit Limit:</span> PKR {creditLimit.toLocaleString()}
            </p>
            <p className={`font-semibold ${isOverLimit ? 'text-red-600' : 'text-yellow-600'}`}>
              Utilization: {utilization.toFixed(1)}%
            </p>
          </div>

          {isOverLimit && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('adminOverride')}
                  onChange={(e) => onOverrideChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Admin Override - Approve this transaction despite credit limit
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Override Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('overrideReason', {
                    validate: (value, formValues) => {
                      if (formValues.adminOverride && !value) {
                        return 'Override reason is required';
                      }
                      return true;
                    },
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Explain why this credit limit override is necessary..."
                />
                {errors.overrideReason && (
                  <p className="text-red-500 text-sm mt-1">{String(errors.overrideReason.message)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
