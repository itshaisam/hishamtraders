# Story 5.1: Chart of Accounts Setup

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.1
**Priority:** Critical
**Estimated Effort:** 10-12 hours
**Dependencies:** Epic 1 (Foundation)
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to define a structured Chart of Accounts with account types and hierarchies,
**So that** all financial transactions can be properly classified and reported.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] AccountHead table created with fields: id, code (unique), name, accountType, parentId, description, openingBalance, currentBalance, status
   - [ ] Account types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
   - [ ] Standard numbering: 1000-1999 (Assets), 2000-2999 (Liabilities), 3000-3999 (Equity), 4000-4999 (Revenue), 5000-5999 (Expenses)

2. **Backend API:**
   - [ ] POST /api/account-heads - Creates new account
   - [ ] GET /api/account-heads - Returns hierarchical account list (tree structure)
   - [ ] GET /api/account-heads/:id - Returns account details with balance
   - [ ] PUT /api/account-heads/:id - Updates account (name, description only; code immutable)
   - [ ] DELETE /api/account-heads/:id - Soft-deletes (only if no transactions)

3. **Hierarchical Structure:**
   - [ ] Parent accounts can have child accounts
   - [ ] Example: 1100 Bank Accounts → 1101 Bank A, 1102 Bank B
   - [ ] Opening balances entered for initial setup

4. **Frontend:**
   - [ ] Chart of Accounts page displays tree hierarchy
   - [ ] Add/edit accounts with type validation
   - [ ] Display account balances (current, opening, difference)

5. **Authorization & Role-Based Access:**
   - [ ] Only Admin and Accountant can manage Chart of Accounts
   - [ ] Account creation/updates logged in audit trail
   - [ ] Other roles: 403 Forbidden

6. **Performance & Caching:**
   - [ ] Cache hierarchy indefinitely (static reference data)
   - [ ] Cache invalidation: Only on account creation/modification
   - [ ] API timeout: 5 seconds maximum
   - [ ] Hierarchy query optimized with indexes on code, type

7. **Error Handling:**
   - [ ] Validate code uniqueness (return 400 if duplicate)
   - [ ] Validate code range matches account type
   - [ ] Prevent deletion if account has transactions
   - [ ] Prevent deletion if account has child accounts
   - [ ] Display validation errors with specific reason

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema**
  - [ ] Create AccountHead model
  - [ ] Create AccountType enum
  - [ ] Create AccountStatus enum
  - [ ] Run migration

- [ ] **Task 2: Account Repository**
  - [ ] Create account-heads.repository.ts
  - [ ] Implement CRUD methods
  - [ ] Implement hierarchy query (parent/child relationships)

- [ ] **Task 3: Account Service**
  - [ ] Create account-heads.service.ts
  - [ ] Validate code uniqueness
  - [ ] Validate code ranges by type
  - [ ] Validate parent-child relationships
  - [ ] Check for transactions before delete

- [ ] **Task 4: Controller & Routes**
  - [ ] Create account-heads.controller.ts
  - [ ] Implement all CRUD endpoints
  - [ ] Apply authorization guards

- [ ] **Task 5: Seed Standard Accounts**
  - [ ] Create seed script for standard Chart of Accounts
  - [ ] Include all standard accounts (1000-5999)

### Frontend Tasks

- [ ] **Task 6: Chart of Accounts Page**
  - [ ] Create ChartOfAccountsPage.tsx
  - [ ] Tree view component for hierarchy
  - [ ] Add/Edit account modal
  - [ ] Account type selector with validation

- [ ] **Task 7: Testing**
  - [ ] Backend tests for hierarchy queries
  - [ ] Frontend tests for tree display

---

## Dev Notes

### Database Schema

```prisma
model AccountHead {
  id              String           @id @default(cuid())
  code            String           @unique
  name            String
  accountType     AccountType
  parentId        String?
  description     String?          @db.Text
  openingBalance  Decimal          @db.Decimal(12, 2) @default(0)
  currentBalance  Decimal          @db.Decimal(12, 2) @default(0)
  status          AccountStatus    @default(ACTIVE)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  parent          AccountHead?     @relation("AccountHierarchy", fields: [parentId], references: [id])
  children        AccountHead[]    @relation("AccountHierarchy")
  journalLines    JournalEntryLine[]

  @@index([accountType, code])
  @@map("account_heads")
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum AccountStatus {
  ACTIVE
  INACTIVE
}
```

### Account Service

```typescript
interface CreateAccountDto {
  code: string;
  name: string;
  accountType: AccountType;
  parentId?: string;
  description?: string;
  openingBalance?: number;
}

class AccountHeadService {
  async createAccount(data: CreateAccountDto): Promise<AccountHead> {
    // Validate code uniqueness
    const existing = await prisma.accountHead.findUnique({
      where: { code: data.code }
    });
    if (existing) {
      throw new BadRequestError('Account code already exists');
    }

    // Validate code range matches account type
    const codeNum = parseInt(data.code);
    const validRanges = {
      ASSET: [1000, 1999],
      LIABILITY: [2000, 2999],
      EQUITY: [3000, 3999],
      REVENUE: [4000, 4999],
      EXPENSE: [5000, 5999]
    };

    const [min, max] = validRanges[data.accountType];
    if (codeNum < min || codeNum > max) {
      throw new BadRequestError(
        `Code ${data.code} is invalid for account type ${data.accountType}. Must be between ${min}-${max}`
      );
    }

    // Validate parent exists and is same type
    if (data.parentId) {
      const parent = await prisma.accountHead.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        throw new NotFoundError('Parent account not found');
      }
      if (parent.accountType !== data.accountType) {
        throw new BadRequestError('Parent account must be same type');
      }
    }

    // Create account
    const account = await prisma.accountHead.create({
      data: {
        code: data.code,
        name: data.name,
        accountType: data.accountType,
        parentId: data.parentId,
        description: data.description,
        openingBalance: data.openingBalance || 0,
        currentBalance: data.openingBalance || 0
      }
    });

    return account;
  }

  async getAccountHierarchy(): Promise<any[]> {
    // Get all accounts
    const accounts = await prisma.accountHead.findMany({
      orderBy: { code: 'asc' }
    });

    // Build tree structure
    const accountMap = new Map();
    const roots: any[] = [];

    // First pass: create map
    accounts.forEach(acc => {
      accountMap.set(acc.id, { ...acc, children: [] });
    });

    // Second pass: build hierarchy
    accounts.forEach(acc => {
      const node = accountMap.get(acc.id);
      if (acc.parentId) {
        const parent = accountMap.get(acc.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async deleteAccount(id: string): Promise<void> {
    // Check for child accounts
    const children = await prisma.accountHead.count({
      where: { parentId: id }
    });
    if (children > 0) {
      throw new BadRequestError('Cannot delete account with child accounts');
    }

    // Check for journal entries
    const journalLines = await prisma.journalEntryLine.count({
      where: { accountHeadId: id }
    });
    if (journalLines > 0) {
      throw new BadRequestError('Cannot delete account with transactions');
    }

    // Soft delete
    await prisma.accountHead.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });
  }
}
```

### Standard Chart of Accounts Seed

```typescript
const STANDARD_ACCOUNTS = [
  // ASSETS (1000-1999)
  { code: '1000', name: 'ASSETS', type: 'ASSET', parent: null },
  { code: '1100', name: 'Bank Accounts', type: 'ASSET', parent: '1000' },
  { code: '1101', name: 'Main Bank Account', type: 'ASSET', parent: '1100' },
  { code: '1102', name: 'Petty Cash', type: 'ASSET', parent: '1100' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', parent: '1000' },
  { code: '1300', name: 'Inventory', type: 'ASSET', parent: '1000' },
  { code: '1400', name: 'Fixed Assets', type: 'ASSET', parent: '1000' },

  // LIABILITIES (2000-2999)
  { code: '2000', name: 'LIABILITIES', type: 'LIABILITY', parent: null },
  { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', parent: '2000' },
  { code: '2200', name: 'Tax Payable', type: 'LIABILITY', parent: '2000' },
  { code: '2300', name: 'Loans Payable', type: 'LIABILITY', parent: '2000' },

  // EQUITY (3000-3999)
  { code: '3000', name: 'EQUITY', type: 'EQUITY', parent: null },
  { code: '3100', name: "Owner's Capital", type: 'EQUITY', parent: '3000' },
  { code: '3200', name: 'Retained Earnings', type: 'EQUITY', parent: '3000' },

  // REVENUE (4000-4999)
  { code: '4000', name: 'REVENUE', type: 'REVENUE', parent: null },
  { code: '4100', name: 'Sales Revenue', type: 'REVENUE', parent: '4000' },
  { code: '4200', name: 'Other Income', type: 'REVENUE', parent: '4000' },

  // EXPENSES (5000-5999)
  { code: '5000', name: 'EXPENSES', type: 'EXPENSE', parent: null },
  { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', parent: '5000' },
  { code: '5150', name: 'Inventory Loss', type: 'EXPENSE', parent: '5000' },
  { code: '5200', name: 'Rent Expense', type: 'EXPENSE', parent: '5000' },
  { code: '5300', name: 'Utilities Expense', type: 'EXPENSE', parent: '5000' },
  { code: '5400', name: 'Salaries Expense', type: 'EXPENSE', parent: '5000' },
  { code: '5500', name: 'Transport Expense', type: 'EXPENSE', parent: '5000' },
  { code: '5900', name: 'Other Expenses', type: 'EXPENSE', parent: '5000' }
];

async function seedChartOfAccounts() {
  for (const account of STANDARD_ACCOUNTS) {
    const parentAccount = account.parent
      ? await prisma.accountHead.findUnique({ where: { code: account.parent } })
      : null;

    await prisma.accountHead.create({
      data: {
        code: account.code,
        name: account.name,
        accountType: account.type,
        parentId: parentAccount?.id
      }
    });
  }
}
```

### Frontend - Tree View Component

```tsx
interface AccountNode {
  id: string;
  code: string;
  name: string;
  accountType: string;
  currentBalance: number;
  children: AccountNode[];
}

const AccountTreeNode: FC<{ node: AccountNode; level: number }> = ({ node, level }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div
        className={cn('flex items-center py-2 px-4 hover:bg-gray-50', {
          'font-bold': level === 0
        })}
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        {node.children.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="mr-2">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        <span className="flex-1">
          {node.code} - {node.name}
        </span>
        <span className="text-gray-600">
          Rs.{node.currentBalance.toFixed(2)}
        </span>
      </div>

      {expanded && node.children.map(child => (
        <AccountTreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
};

export const ChartOfAccountsPage: FC = () => {
  const { data: accounts, isLoading } = useGetAccountHierarchy();
  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Card>
        <Card.Body>
          {accounts?.map(account => (
            <AccountTreeNode key={account.id} node={account} level={0} />
          ))}
        </Card.Body>
      </Card>

      {showAddModal && (
        <AddAccountModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};
```

---

## Testing

### Backend Testing
- Account code uniqueness validation
- Code range validation by account type
- Parent-child relationship validation
- Hierarchy query correctness
- Cannot delete account with transactions
- Cannot delete account with children

### Frontend Testing
- Tree hierarchy display
- Expand/collapse functionality
- Add account modal
- Account type validation

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
