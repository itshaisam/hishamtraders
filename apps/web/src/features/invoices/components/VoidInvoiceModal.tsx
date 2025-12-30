import { FC, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Invoice } from '../../../types/invoice.types';

interface VoidInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

/**
 * Modal for voiding an invoice
 * Story 3.4: Invoice Voiding and Stock Reversal
 */
export const VoidInvoiceModal: FC<VoidInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim() || reason.length < 10) {
      setError('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    if (reason.length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    if (!confirmed) {
      setError('Please confirm you understand the consequences');
      return;
    }

    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Void Invoice {invoice.invoiceNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Warning Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              Warning: This action will:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              <li>Mark the invoice as VOIDED (cannot be undone)</li>
              <li>Reverse all inventory deductions (stock will be restored)</li>
              <li>
                {invoice.paymentType === 'CREDIT' && (
                  <>Reduce client balance by PKR {Number(invoice.total).toLocaleString()}</>
                )}
                {invoice.paymentType === 'CASH' && <>No balance change (CASH invoice)</>}
              </li>
              <li>Create audit trail records</li>
            </ul>
          </div>

          {/* Invoice Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Invoice Details:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded-lg p-4">
              <div>
                <span className="text-gray-600">Client:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.client.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium text-gray-900">
                  PKR {Number(invoice.total).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Voiding <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Explain why this invoice is being voided..."
              rows={4}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Minimum 10 characters, maximum 500</p>
              <p className="text-xs text-gray-500">
                {reason.length}/500
              </p>
            </div>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="confirm-void"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setError('');
              }}
              disabled={isLoading}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="confirm-void" className="ml-2 text-sm text-gray-700">
              I understand this will reverse inventory deductions and update client balance
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || !confirmed || isLoading}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Voiding...' : 'Void Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};
