# Story 9.5: Tenant Onboarding

**Epic:** Epic 9 - Multi-Tenant SaaS Architecture
**Story ID:** STORY-9.5
**Priority:** High
**Estimated Effort:** 3-4 hours
**Dependencies:** Stories 9.1-9.4 (schema, middleware, seeds all complete)
**Status:** Draft -- Phase 3 (v1.0)

---

## User Story

**As a** platform admin,
**I want** a script and API to create new tenants with all required seed data,
**So that** onboarding a new client is a single command, not a manual process.

---

## Acceptance Criteria

1. **Tenant Onboarding Script:**
   - [ ] New file: `apps/api/src/scripts/create-tenant.ts`
   - [ ] Accepts command-line arguments: `--name`, `--slug`, `--admin-email`, `--admin-password`
   - [ ] Creates in a single transaction:
     - Tenant record
     - Admin user (with ADMIN role, linked to tenant)
     - Full chart of accounts (clone 15+ account heads)
     - Default system settings (COMPANY_NAME, TAX_RATE, CURRENCY_SYMBOL)
   - [ ] Outputs created tenant ID and admin credentials on success
   - [ ] Validates: slug is unique, email is unique, password meets minimum length

2. **NPM Script:**
   - [ ] `pnpm db:create-tenant` runs the onboarding script
   - [ ] Added to `apps/api/package.json` scripts section

3. **Chart of Accounts Cloning:**
   - [ ] Copies the standard chart of accounts for the new tenant:
     - 1101 Main Bank Account (ASSET)
     - 1102 Petty Cash (ASSET)
     - 1200 Accounts Receivable (ASSET)
     - 1300 Inventory (ASSET)
     - 2100 Accounts Payable (LIABILITY)
     - 2200 Tax Payable (LIABILITY)
     - 3100 Owner's Equity (EQUITY)
     - 4100 Sales Revenue (REVENUE)
     - 4200 Other Income (REVENUE)
     - 5100 Cost of Goods Sold (EXPENSE)
     - 5150 Inventory Loss (EXPENSE)
     - 5200 Rent Expense (EXPENSE)
     - 5300 Utilities Expense (EXPENSE)
     - 5400 Salary Expense (EXPENSE)
     - 5500 Transport Expense (EXPENSE)
     - 5900 General Expense (EXPENSE)
   - [ ] Each account created with the new tenant's tenantId
   - [ ] Account codes are the same across tenants (1101, 1200, etc.)

4. **Default System Settings:**
   - [ ] COMPANY_NAME = tenant name (from --name argument)
   - [ ] TAX_RATE = '18' (default, admin can change later)
   - [ ] CURRENCY_SYMBOL = 'PKR' (default, admin can change later)

5. **Admin API Endpoint (Optional — for future UI):**
   - [ ] POST /api/v1/admin/tenants — creates a new tenant (platform admin only)
   - [ ] Request body: `{ name, slug, adminEmail, adminPassword }`
   - [ ] Response: `{ tenantId, adminUserId, message }`
   - [ ] Only accessible to platform super-admin (not regular tenant admins)

6. **Validation & Error Handling:**
   - [ ] Duplicate slug → clear error message
   - [ ] Duplicate admin email → clear error message
   - [ ] Missing required args → usage help displayed
   - [ ] Transaction rollback on any failure (no partial tenant creation)

---

## Dev Notes

### Onboarding Script

**File:** `apps/api/src/scripts/create-tenant.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// NOTE: Uses raw PrismaClient (not extended) because this is a system script
// that runs outside HTTP request context — no tenant filtering needed.

interface TenantArgs {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

function parseArgs(): TenantArgs {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    parsed[key] = args[i + 1];
  }

  if (!parsed.name || !parsed.slug || !parsed['admin-email'] || !parsed['admin-password']) {
    console.error('Usage: pnpm db:create-tenant --name "Company Name" --slug "company-slug" --admin-email "admin@company.com" --admin-password "secure123"');
    process.exit(1);
  }

  return {
    name: parsed.name,
    slug: parsed.slug,
    adminEmail: parsed['admin-email'],
    adminPassword: parsed['admin-password'],
  };
}

async function createTenant(args: TenantArgs) {
  console.log(`\n🏢 Creating tenant: ${args.name} (${args.slug})`);

  // Validate uniqueness
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: args.slug } });
  if (existingTenant) {
    throw new Error(`Tenant with slug "${args.slug}" already exists`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: args.adminEmail } });
  if (existingUser) {
    throw new Error(`User with email "${args.adminEmail}" already exists`);
  }

  // Find ADMIN role
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    throw new Error('ADMIN role not found. Run base seed first.');
  }

  // Create everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        name: args.name,
        slug: args.slug,
        status: 'active',
      },
    });
    console.log(`  ✓ Tenant created: ${tenant.id}`);

    // 2. Create Admin User
    const passwordHash = await bcrypt.hash(args.adminPassword, 10);
    const adminUser = await tx.user.create({
      data: {
        email: args.adminEmail,
        passwordHash,
        name: `${args.name} Admin`,
        roleId: adminRole.id,
        tenantId: tenant.id,
      },
    });
    console.log(`  ✓ Admin user created: ${adminUser.email}`);

    // 3. Clone Chart of Accounts
    const accounts = [
      { code: '1101', name: 'Main Bank Account', accountType: 'ASSET' },
      { code: '1102', name: 'Petty Cash', accountType: 'ASSET' },
      { code: '1200', name: 'Accounts Receivable', accountType: 'ASSET' },
      { code: '1300', name: 'Inventory', accountType: 'ASSET' },
      { code: '2100', name: 'Accounts Payable', accountType: 'LIABILITY' },
      { code: '2200', name: 'Tax Payable', accountType: 'LIABILITY' },
      { code: '3100', name: "Owner's Equity", accountType: 'EQUITY' },
      { code: '4100', name: 'Sales Revenue', accountType: 'REVENUE' },
      { code: '4200', name: 'Other Income', accountType: 'REVENUE' },
      { code: '5100', name: 'Cost of Goods Sold', accountType: 'EXPENSE' },
      { code: '5150', name: 'Inventory Loss', accountType: 'EXPENSE' },
      { code: '5200', name: 'Rent Expense', accountType: 'EXPENSE' },
      { code: '5300', name: 'Utilities Expense', accountType: 'EXPENSE' },
      { code: '5400', name: 'Salary Expense', accountType: 'EXPENSE' },
      { code: '5500', name: 'Transport Expense', accountType: 'EXPENSE' },
      { code: '5900', name: 'General Expense', accountType: 'EXPENSE' },
    ];

    await tx.accountHead.createMany({
      data: accounts.map(a => ({
        ...a,
        balance: 0,
        isActive: true,
        tenantId: tenant.id,
      })),
    });
    console.log(`  ✓ Chart of accounts created (${accounts.length} accounts)`);

    // 4. Default System Settings
    const settings = [
      { key: 'COMPANY_NAME', value: args.name, dataType: 'string', label: 'Company Name', category: 'company' },
      { key: 'TAX_RATE', value: '18', dataType: 'number', label: 'Default Tax Rate (%)', category: 'tax' },
      { key: 'CURRENCY_SYMBOL', value: 'PKR', dataType: 'string', label: 'Currency Symbol', category: 'currency' },
    ];

    await tx.systemSetting.createMany({
      data: settings.map(s => ({ ...s, tenantId: tenant.id })),
    });
    console.log(`  ✓ System settings created (${settings.length} settings)`);

    return { tenant, adminUser };
  });

  console.log(`\n✅ Tenant "${args.name}" created successfully!`);
  console.log(`   Tenant ID: ${result.tenant.id}`);
  console.log(`   Admin Login: ${result.adminUser.email}`);
  console.log(`   Admin Password: (as provided)`);
}

createTenant(parseArgs())
  .catch((e) => {
    console.error(`\n❌ Error: ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### NPM Script

**File:** `apps/api/package.json`

Add to `scripts`:
```json
{
  "db:create-tenant": "tsx src/scripts/create-tenant.ts"
}
```

### Usage

```bash
# Create a new tenant
pnpm -F @hishamtraders/api db:create-tenant \
  --name "ABC Trading Co." \
  --slug "abc-trading" \
  --admin-email "admin@abctrading.com" \
  --admin-password "SecurePass123!"

# Output:
# 🏢 Creating tenant: ABC Trading Co. (abc-trading)
#   ✓ Tenant created: cm1abc...
#   ✓ Admin user created: admin@abctrading.com
#   ✓ Chart of accounts created (16 accounts)
#   ✓ System settings created (3 settings)
#
# ✅ Tenant "ABC Trading Co." created successfully!
#    Tenant ID: cm1abc...
#    Admin Login: admin@abctrading.com
```

### Login Page Behavior

After onboarding:
- User navigates to the app URL
- Enters their tenant-specific email (e.g., `admin@abctrading.com`)
- JWT is generated with their tenantId
- All subsequent API calls are scoped to their tenant
- Company name on login page: fetched from `/api/v1/settings/company-name` — but this is now tenant-scoped, so **before login there's no tenant context**

> **Important edge case:** The company name on the login page currently uses `useCompanyName` hook which calls `/api/v1/settings/company-name`. This is a public route (no auth). After multi-tenancy, which tenant's company name should it show? Options:
> 1. Show a generic "ERP System" on the login page (simplest)
> 2. Use subdomain/URL to determine tenant (future: `abc.erp.com`)
> 3. Show company name only after user enters email (fetch tenant from email domain)
>
> **For now:** Option 1 — show generic name. The login page fallback `'Advance ERP System'` already handles this.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-14 | 1.0 | Initial story creation | Claude (Tech Review) |
