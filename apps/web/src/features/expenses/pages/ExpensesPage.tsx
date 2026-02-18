import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { ListPageSkeleton } from '../../../components/ui';
import { Edit, Trash, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useExpenses, useDeleteExpense } from '../../../hooks/useExpenses';
import { useCurrencySymbol } from '../../../hooks/useSettings';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../../../types/expense.types';
import { ExpenseInlineForm } from '../components/ExpenseInlineForm';
import { useAuthStore } from '../../../stores/auth.store';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: 'bg-purple-100 text-purple-700',
  [ExpenseCategory.UTILITIES]: 'bg-yellow-100 text-yellow-700',
  [ExpenseCategory.SALARIES]: 'bg-green-100 text-green-700',
  [ExpenseCategory.SUPPLIES]: 'bg-blue-100 text-blue-700',
  [ExpenseCategory.MAINTENANCE]: 'bg-orange-100 text-orange-700',
  [ExpenseCategory.MARKETING]: 'bg-pink-100 text-pink-700',
  [ExpenseCategory.TRANSPORT]: 'bg-teal-100 text-teal-700',
  [ExpenseCategory.MISC]: 'bg-gray-100 text-gray-700',
};

export function ExpensesPage() {
  const { user } = useAuthStore();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '' as ExpenseCategory | '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useExpenses(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  );
  const deleteMutation = useDeleteExpense();

  const canManage =
    user?.role?.name && ['ADMIN', 'ACCOUNTANT'].includes(user.role.name);

  // Calculate total from current page
  const totalExpenses = useMemo(() => {
    return (
      data?.data.reduce(
        (sum: number, expense: Expense) => sum + parseFloat(expense.amount.toString()),
        0
      ) || 0
    );
  }, [data]);

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    if (!data?.data) return {};
    return data.data.reduce(
      (groups: Record<string, Expense[]>, expense: Expense) => {
        const dateKey = format(new Date(expense.date), 'yyyy-MM-dd');
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(expense);
        return groups;
      },
      {}
    );
  }, [data]);

  // Sorted date keys (newest first)
  const sortedDates = useMemo(() => {
    return Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));
  }, [groupedExpenses]);

  // Day totals
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [date, expenses] of Object.entries(groupedExpenses)) {
      totals[date] = expenses.reduce(
        (sum, exp) => sum + parseFloat(exp.amount.toString()),
        0
      );
    }
    return totals;
  }, [groupedExpenses]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (id: string) => {
    setEditingExpenseId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
  };

  const hasActiveFilters = filters.category || filters.dateFrom || filters.dateTo;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Breadcrumbs items={[{ label: 'Payments', href: '/payments/supplier' }, { label: 'Expenses' }]} className="mb-4" />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Period Total</div>
          <div className="text-xl font-bold text-red-600">
            {cs} {totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </div>
        </div>
      </div>

      {/* Inline Entry Form */}
      {canManage && (
        <div className="mb-4">
          <ExpenseInlineForm
            editingExpenseId={editingExpenseId}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      )}

      {/* Filters (collapsible) */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded border transition ${
            hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
              {[filters.category, filters.dateFrom, filters.dateTo].filter(Boolean).length}
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {showFilters && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value as ExpenseCategory | '',
                      page: 1,
                    }))
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="">All Categories</option>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateFrom: e.target.value, page: 1 }))
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value, page: 1 }))
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({ category: '', dateFrom: '', dateTo: '', page: 1, limit: 20 })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Ledger */}
      {isLoading ? (
        <ListPageSkeleton />
      ) : error ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-600">Failed to load expenses</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">No expenses found. Start by adding one above.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-t-lg border border-gray-200 border-b-0">
                <span className="text-sm font-semibold text-gray-700">
                  {format(new Date(dateKey + 'T00:00:00'), 'EEEE, MMM dd, yyyy')}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {cs} {dayTotals[dateKey].toLocaleString('en-PK', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </span>
              </div>

              {/* Expense Rows */}
              <div className="bg-white border border-gray-200 rounded-b-lg divide-y divide-gray-100 mb-3">
                {groupedExpenses[dateKey].map((expense) => (
                  <div
                    key={expense.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition ${
                      editingExpenseId === expense.id ? 'bg-yellow-50' : ''
                    }`}
                  >
                    {/* Category Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                        CATEGORY_COLORS[expense.category as ExpenseCategory] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategory]}
                    </span>

                    {/* Description */}
                    <span className="flex-1 text-sm text-gray-800 truncate">
                      {expense.description}
                    </span>

                    {/* Payment Method */}
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {PAYMENT_METHOD_LABELS[expense.paymentMethod as PaymentMethod]}
                    </span>

                    {/* Recorded By */}
                    <span className="text-xs text-gray-400 hidden md:inline">
                      {expense.user?.name}
                    </span>

                    {/* Amount */}
                    <span className="text-sm font-semibold text-gray-900 tabular-nums w-28 text-right">
                      {cs} {parseFloat(expense.amount.toString()).toLocaleString('en-PK', {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </span>

                    {/* Actions (visible on hover) */}
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(expense.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={data.meta.page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={data.meta.page === data.meta.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
