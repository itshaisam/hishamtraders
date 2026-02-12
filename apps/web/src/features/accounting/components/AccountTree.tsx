import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { AccountHead, AccountType } from '../../../types/accounting.types';
import Badge from '../../../components/ui/Badge';

interface AccountTreeProps {
  accounts: AccountHead[];
  onSelect?: (account: AccountHead) => void;
  selectedId?: string;
}

const TYPE_BADGE_VARIANT: Record<AccountType, 'info' | 'danger' | 'warning' | 'success' | 'default'> = {
  ASSET: 'info',
  LIABILITY: 'danger',
  EQUITY: 'default',
  REVENUE: 'success',
  EXPENSE: 'warning',
};

function AccountTreeNode({
  account,
  depth = 0,
  onSelect,
  selectedId,
}: {
  account: AccountHead;
  depth?: number;
  onSelect?: (account: AccountHead) => void;
  selectedId?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasChildren = account.children && account.children.length > 0;
  const isSelected = selectedId === account.id;

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-50 transition ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect?.(account)}
      >
        {/* Expand/Collapse toggle */}
        <button
          className="w-5 h-5 flex items-center justify-center flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="text-gray-500" />
            ) : (
              <ChevronRight size={14} className="text-gray-500" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        {/* Code */}
        <span className="text-xs font-mono text-gray-500 w-12 flex-shrink-0">
          {account.code}
        </span>

        {/* Name */}
        <span className={`text-sm flex-1 ${depth === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {account.name}
        </span>

        {/* Type badge (only on root) */}
        {depth === 0 && (
          <Badge variant={TYPE_BADGE_VARIANT[account.accountType]} size="sm">
            {account.accountType}
          </Badge>
        )}

        {/* Balance */}
        <span className={`text-sm font-mono w-28 text-right flex-shrink-0 ${
          Number(account.currentBalance) < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          {formatBalance(Number(account.currentBalance))}
        </span>

        {/* Status */}
        {account.status === 'INACTIVE' && (
          <Badge variant="default" size="sm">Inactive</Badge>
        )}

        {/* System account indicator */}
        {account.isSystemAccount && (
          <span className="text-xs text-gray-400" title="System account">S</span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {account.children!.map((child) => (
            <AccountTreeNode
              key={child.id}
              account={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountTree({ accounts, onSelect, selectedId }: AccountTreeProps) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No accounts found. Create your first account to get started.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 py-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <span className="w-5" />
        <span className="w-12">Code</span>
        <span className="flex-1">Account Name</span>
        <span className="w-16">Type</span>
        <span className="w-28 text-right">Balance</span>
        <span className="w-12" />
      </div>

      {/* Tree */}
      {accounts.map((account) => (
        <AccountTreeNode
          key={account.id}
          account={account}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}
