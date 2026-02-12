import { useState, useEffect } from 'react';
import { Plus, Save, X, Search, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { Card, Modal, Spinner } from '../../../components/ui';
import { AccountTree } from '../components/AccountTree';
import {
  useAccountHeadTree,
  useAccountHeads,
  useCreateAccountHead,
  useUpdateAccountHead,
  useDeleteAccountHead,
} from '../../../hooks/useAccountHeads';
import { AccountHead, AccountType, CreateAccountHeadDto, UpdateAccountHeadDto } from '../../../types/accounting.types';

const ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];

const TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
};

export function ChartOfAccountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountHead | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountHead | null>(null);
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('ASSET');
  const [parentId, setParentId] = useState('');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data: treeData, isLoading: treeLoading, refetch: refetchTree } = useAccountHeadTree();
  const { data: flatData, isLoading: flatLoading } = useAccountHeads({
    accountType: (filterType as AccountType) || undefined,
    search: searchTerm || undefined,
    limit: 100,
  });

  // Parent options: load accounts of the same type for the parent dropdown
  const { data: parentOptions } = useAccountHeads({ accountType, limit: 100 });

  const createMutation = useCreateAccountHead();
  const updateMutation = useUpdateAccountHead();
  const deleteMutation = useDeleteAccountHead();

  const isFiltering = !!filterType || !!searchTerm;
  const displayData = isFiltering ? flatData?.data : treeData;
  const isLoading = isFiltering ? flatLoading : treeLoading;
  const isEdit = !!editingAccount;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setCode('');
    setName('');
    setAccountType('ASSET');
    setParentId('');
    setOpeningBalance(0);
    setDescription('');
    setFormError('');
    setEditingAccount(null);
  };

  const handleStartEdit = (account: AccountHead) => {
    setEditingAccount(account);
    setShowForm(true);
    setName(account.name);
    setAccountType(account.accountType);
    setParentId(account.parentId || '');
    setOpeningBalance(Number(account.openingBalance));
    setDescription(account.description || '');
    setCode(account.code);
  };

  const handleAddNew = () => {
    resetForm();
    // If an account is selected, pre-fill parent & type
    if (selectedAccount) {
      setAccountType(selectedAccount.accountType);
      setParentId(selectedAccount.id);
    }
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }

    if (isEdit && editingAccount) {
      updateMutation.mutate(
        {
          id: editingAccount.id,
          data: {
            name: name.trim(),
            parentId: parentId || null,
            openingBalance,
            description: description || null,
          } as UpdateAccountHeadDto,
        },
        {
          onSuccess: () => {
            resetForm();
            setShowForm(false);
            setSelectedAccount(null);
            refetchTree();
          },
        }
      );
    } else {
      if (!code || code.length < 4) {
        setFormError('Code must be at least 4 digits');
        return;
      }

      createMutation.mutate(
        {
          code,
          name: name.trim(),
          accountType,
          parentId: parentId || null,
          openingBalance,
          description: description || null,
        } as CreateAccountHeadDto,
        {
          onSuccess: () => {
            resetForm();
            // Keep form open for rapid entry
            refetchTree();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!selectedAccount) return;
    deleteMutation.mutate(selectedAccount.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedAccount(null);
        refetchTree();
      },
    });
  };

  const handleAccountSelect = (account: AccountHead) => {
    setSelectedAccount(account);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-sm text-gray-500">Manage your account heads and hierarchy</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchTree()}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          {!showForm && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} />
              Add Account
            </button>
          )}
        </div>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {isEdit ? `Edit Account: ${editingAccount?.code}` : 'New Account'}
            </h2>
            {isEdit && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {TYPE_LABELS[editingAccount?.accountType || 'ASSET']}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            {/* Row 1: Code, Name, Type, Parent */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Code - only for create */}
              <div className={isEdit ? 'hidden' : 'md:col-span-2'}>
                <label className="block text-xs font-medium text-gray-500 mb-1">Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCode(val);
                    // Auto-set type from first digit
                    const typeMap: Record<string, AccountType> = {
                      '1': 'ASSET', '2': 'LIABILITY', '3': 'EQUITY', '4': 'REVENUE', '5': 'EXPENSE',
                    };
                    if (val.length >= 1 && typeMap[val[0]]) {
                      setAccountType(typeMap[val[0]]);
                      setParentId('');
                    }
                  }}
                  placeholder="e.g. 1103"
                  maxLength={10}
                  className={`w-full border rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formError && !code ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <p className="mt-1 text-[10px] text-gray-400 leading-tight">
                  1xxx Asset &middot; 2xxx Liability &middot; 3xxx Equity &middot; 4xxx Revenue &middot; 5xxx Expense
                </p>
              </div>

              {/* Name */}
              <div className={isEdit ? 'md:col-span-4' : 'md:col-span-3'}>
                <label className="block text-xs font-medium text-gray-500 mb-1">Account Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Savings Account"
                  className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formError && !name.trim() ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Type - only for create */}
              <div className={isEdit ? 'hidden' : 'md:col-span-2'}>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={accountType}
                  onChange={(e) => {
                    setAccountType(e.target.value as AccountType);
                    setParentId('');
                  }}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              {/* Parent */}
              <div className={isEdit ? 'md:col-span-4' : 'md:col-span-3'}>
                <label className="block text-xs font-medium text-gray-500 mb-1">Parent Account</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">None (Root)</option>
                  {parentOptions?.data
                    ?.filter((a: AccountHead) => a.id !== editingAccount?.id)
                    .map((a: AccountHead) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Opening Balance */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Opening Bal.</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Row 2: Description + Actions */}
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {!isEdit && code.length >= 1 && (
                <div className="flex items-center">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1.5 rounded border border-gray-200">
                    Type: <span className="font-medium text-gray-600">{TYPE_LABELS[accountType]}</span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
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
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <div className="mt-2 text-xs text-red-500">{formError}</div>
            )}
          </form>
        </div>
      )}

      {/* Filters + Selected Account Actions */}
      <Card>
        <div className="p-3 flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
          >
            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Selected account actions */}
          {selectedAccount && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                <span className="font-mono">{selectedAccount.code}</span> {selectedAccount.name}
              </span>
              <button
                onClick={() => handleStartEdit(selectedAccount)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit2 size={12} />
                Edit
              </button>
              {!selectedAccount.isSystemAccount && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              )}
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
                title="Clear selection"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </Card>

      {/* Account Tree */}
      <Card>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : isFiltering ? (
            <div className="space-y-1">
              {flatData?.data && flatData.data.length > 0 ? (
                flatData.data.map((account: AccountHead) => (
                  <div
                    key={account.id}
                    className={`flex items-center gap-3 py-2 px-3 rounded cursor-pointer hover:bg-gray-50 ${
                      selectedAccount?.id === account.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <span className="text-xs font-mono text-gray-500 w-12">{account.code}</span>
                    <span className="text-sm flex-1">{account.name}</span>
                    <span className="text-xs text-gray-400">{account.accountType}</span>
                    <span className="text-sm font-mono text-gray-600 w-28 text-right">
                      {new Intl.NumberFormat('en-PK', {
                        style: 'currency',
                        currency: 'PKR',
                        minimumFractionDigits: 0,
                      }).format(Number(account.currentBalance))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No accounts match your search.</p>
              )}
            </div>
          ) : (
            <AccountTree
              accounts={displayData || []}
              onSelect={handleAccountSelect}
              selectedId={selectedAccount?.id}
            />
          )}
        </div>
      </Card>

      {/* Delete Confirmation */}
      {showDeleteModal && selectedAccount && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{selectedAccount.code} - {selectedAccount.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
