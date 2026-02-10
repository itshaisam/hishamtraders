# Story 5.1: Chart of Accounts Setup

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.1
**Priority:** Critical
**Estimated Effort:** 10-12 hours
**Dependencies:** Epic 1 (Foundation)
**Status:** Draft — Phase 2

---

## User Story

**As an** accountant,
**I want** to define a structured Chart of Accounts with account types and hierarchies,
**So that** all financial transactions can be properly classified and reported.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] `AccountHead` model: id, code (unique), name, accountType, parentId (self-relation), description, openingBalance, currentBalance, status
   - [ ] `AccountType` enum: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
   - [ ] `AccountStatus` enum: ACTIVE, INACTIVE
   - [ ] Standard numbering: 1000-1999 (Assets), 2000-2999 (Liabilities), 3000-3999 (Equity), 4000-4999 (Revenue), 5000-5999 (Expenses)

2. **Backend API:**
   - [ ] `POST /api/v1/account-heads` — Create new account
   - [ ] `GET /api/v1/account-heads` — Return hierarchical account list (tree structure)
   - [ ] `GET /api/v1/account-heads/:id` — Return account details with balance
   - [ ] `PUT /api/v1/account-heads/:id` — Update account (name, description only; code immutable)
   - [ ] `DELETE /api/v1/account-heads/:id` — Soft-delete (only if no transactions and no children)

3. **Hierarchical Structure:**
   - [ ] Parent accounts can have child accounts (self-referential FK)
   - [ ] Example: 1100 Bank Accounts → 1101 Bank A, 1102 Bank B
   - [ ] Opening balances entered for initial setup

4. **Frontend:**
   - [ ] Chart of Accounts page displays tree hierarchy
   - [ ] Add/edit accounts with type validation
   - [ ] Display account balances (current, opening)

5. **Authorization:**
   - [ ] Only `ADMIN` and `ACCOUNTANT` can manage accounts
   - [ ] Other roles: 403 Forbidden

6. **Seed Standard Accounts:**
   - [ ] Create seed script with standard Chart of Accounts (see Dev Notes)

---

## Dev Notes

### Implementation Status

**Backend:** Not started. `AccountHead` model does not exist in schema.

**Frontend:** No Chart of Accounts page exists.

### Database Schema (Proposed)

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
  { code: '5900', name: 'Other Expenses', type: 'EXPENSE', parent: '5000' },
];
```

### Validation Rules

- Code must be unique
- Code must fall within valid range for its account type (1000-1999 Asset, etc.)
- Parent must be same account type
- Cannot delete account with child accounts
- Cannot delete account with journal entry lines

### Module Structure

```
apps/api/src/modules/account-heads/
  account-heads.controller.ts
  account-heads.service.ts
  account-heads.repository.ts
  account-heads.routes.ts

apps/web/src/features/accounting/pages/
  ChartOfAccountsPage.tsx
```

### POST-MVP DEFERRED

- **Server-side caching with invalidation**: Use TanStack Query client-side caching. Account hierarchy is small data.
- **Account code auto-suggestion**: Manual entry is fine for MVP.
