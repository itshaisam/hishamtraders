import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Save, X } from 'lucide-react';
import { useExpense, useCreateExpense, useUpdateExpense } from '../../../hooks/useExpenses';
import {
  ExpenseCategory,
  PaymentMethod,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  CreateExpenseDto,
} from '../../../types/expense.types';
import { format } from 'date-fns';

interface ExpenseInlineFormProps {
  editingExpenseId: string | null;
  onCancelEdit: () => void;
}

export function ExpenseInlineForm({ editingExpenseId, onCancelEdit }: ExpenseInlineFormProps) {
  const isEdit = !!editingExpenseId;
  const { data: expense } = useExpense(editingExpenseId || '');
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateExpenseDto>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: ExpenseCategory.MISC,
      description: '',
      amount: 0,
      paymentMethod: PaymentMethod.CASH,
      receiptUrl: '',
    },
  });

  useEffect(() => {
    if (expense && isEdit) {
      reset({
        category: expense.category,
        amount: parseFloat(expense.amount.toString()),
        description: expense.description,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        paymentMethod: expense.paymentMethod,
        receiptUrl: expense.receiptUrl || '',
      });
    }
  }, [expense, isEdit, reset]);

  const resetToDefaults = () => {
    reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: ExpenseCategory.MISC,
      description: '',
      amount: 0,
      paymentMethod: PaymentMethod.CASH,
      receiptUrl: '',
    });
  };

  const onSubmit = (data: CreateExpenseDto) => {
    if (isEdit && editingExpenseId) {
      updateMutation.mutate(
        { id: editingExpenseId, data },
        {
          onSuccess: () => {
            resetToDefaults();
            onCancelEdit();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          resetToDefaults();
        },
      });
    }
  };

  const handleCancel = () => {
    resetToDefaults();
    onCancelEdit();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <h2 className="text-sm font-semibold text-gray-700">
          {isEdit ? 'Edit Expense' : 'New Expense Entry'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        {/* Row 1: Date, Category, Description, Amount */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              {...register('date', { required: 'Date is required' })}
              max={format(new Date(), 'yyyy-MM-dd')}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.date ? 'border-red-400' : 'border-gray-300'
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.category ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input
              type="text"
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 3, message: 'Min 3 characters' },
                maxLength: { value: 500, message: 'Max 500 characters' },
              })}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.description ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="Enter expense details..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount (Rs)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Must be > 0' },
                valueAsNumber: true,
              })}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.amount ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment</label>
            <select
              {...register('paymentMethod', { required: 'Required' })}
              className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.paymentMethod ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Receipt + Actions */}
        <div className="mt-3 flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Receipt URL (optional)
            </label>
            <input
              type="text"
              {...register('receiptUrl')}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Receipt URL or path"
            />
          </div>

          <div className="flex items-center gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                'Saving...'
              ) : isEdit ? (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add Expense
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation errors summary */}
        {hasErrors && (
          <div className="mt-2 text-xs text-red-500">
            {Object.values(errors).map((err, i) => (
              <span key={i}>
                {err?.message}
                {i < Object.values(errors).length - 1 && ' | '}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
