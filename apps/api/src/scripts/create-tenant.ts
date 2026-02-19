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

  if (parsed['admin-password'].length < 6) {
    console.error('Error: Password must be at least 6 characters');
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
  console.log(`\nCreating tenant: ${args.name} (${args.slug})`);

  // Validate uniqueness
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: args.slug } });
  if (existingTenant) {
    throw new Error(`Tenant with slug "${args.slug}" already exists`);
  }

  const existingUser = await prisma.user.findFirst({ where: { email: args.adminEmail } });
  if (existingUser) {
    throw new Error(`User with email "${args.adminEmail}" already exists`);
  }

  // Find ADMIN role
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    throw new Error('ADMIN role not found. Run base seed first (pnpm db:seed).');
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
    console.log(`  [OK] Tenant created: ${tenant.id}`);

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
    console.log(`  [OK] Admin user created: ${adminUser.email}`);

    // 3. Chart of Accounts (hierarchical with parent-child)
    const accountHeads = [
      // ASSETS (1xxx)
      { code: '1000', name: 'Assets', accountType: 'ASSET' as const, parentCode: null as string | null, isSystemAccount: true },
      { code: '1100', name: 'Bank Accounts', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: true },
      { code: '1101', name: 'Main Bank Account', accountType: 'ASSET' as const, parentCode: '1100', isSystemAccount: true },
      { code: '1102', name: 'Petty Cash', accountType: 'ASSET' as const, parentCode: '1100', isSystemAccount: true },
      { code: '1200', name: 'Accounts Receivable', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: true },
      { code: '1300', name: 'Inventory', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: true },
      { code: '1400', name: 'Fixed Assets', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: false },

      // LIABILITIES (2xxx)
      { code: '2000', name: 'Liabilities', accountType: 'LIABILITY' as const, parentCode: null as string | null, isSystemAccount: true },
      { code: '2100', name: 'Accounts Payable', accountType: 'LIABILITY' as const, parentCode: '2000', isSystemAccount: true },
      { code: '2200', name: 'Tax Payable', accountType: 'LIABILITY' as const, parentCode: '2000', isSystemAccount: true },
      { code: '2300', name: 'Loans Payable', accountType: 'LIABILITY' as const, parentCode: '2000', isSystemAccount: false },

      // EQUITY (3xxx)
      { code: '3000', name: 'Equity', accountType: 'EQUITY' as const, parentCode: null as string | null, isSystemAccount: true },
      { code: '3100', name: "Owner's Capital", accountType: 'EQUITY' as const, parentCode: '3000', isSystemAccount: true },
      { code: '3200', name: 'Retained Earnings', accountType: 'EQUITY' as const, parentCode: '3000', isSystemAccount: true },

      // REVENUE (4xxx)
      { code: '4000', name: 'Revenue', accountType: 'REVENUE' as const, parentCode: null as string | null, isSystemAccount: true },
      { code: '4100', name: 'Sales Revenue', accountType: 'REVENUE' as const, parentCode: '4000', isSystemAccount: true },
      { code: '4200', name: 'Other Income', accountType: 'REVENUE' as const, parentCode: '4000', isSystemAccount: false },

      // EXPENSES (5xxx)
      { code: '5000', name: 'Expenses', accountType: 'EXPENSE' as const, parentCode: null as string | null, isSystemAccount: true },
      { code: '5100', name: 'Cost of Goods Sold', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: true },
      { code: '5150', name: 'Inventory Loss', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: true },
      { code: '5200', name: 'Rent Expense', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: false },
      { code: '5300', name: 'Utilities Expense', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: false },
      { code: '5400', name: 'Salaries Expense', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: false },
      { code: '5500', name: 'Transport Expense', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: false },
      { code: '5900', name: 'Other Expenses', accountType: 'EXPENSE' as const, parentCode: '5000', isSystemAccount: false },
    ];

    // Create accounts in order (parents first) to build parent-child relationships
    const accountIdMap: Record<string, string> = {};
    for (const acct of accountHeads) {
      const parentId = acct.parentCode ? accountIdMap[acct.parentCode] : null;
      const created = await tx.accountHead.create({
        data: {
          code: acct.code,
          name: acct.name,
          accountType: acct.accountType,
          parentId,
          isSystemAccount: acct.isSystemAccount,
          openingBalance: 0,
          currentBalance: 0,
          tenantId: tenant.id,
        },
      });
      accountIdMap[acct.code] = created.id;
    }
    console.log(`  [OK] Chart of accounts created (${accountHeads.length} accounts with hierarchy)`);

    // 4. Default System Settings
    const settings = [
      { key: 'COMPANY_NAME', value: args.name, dataType: 'string', label: 'Company Name', category: 'company' },
      { key: 'TAX_RATE', value: '18', dataType: 'number', label: 'Default Tax Rate (%)', category: 'tax' },
      { key: 'CURRENCY_SYMBOL', value: 'PKR', dataType: 'string', label: 'Currency Symbol', category: 'currency' },
    ];

    await tx.systemSetting.createMany({
      data: settings.map(s => ({ ...s, tenantId: tenant.id })),
    });
    console.log(`  [OK] System settings created (${settings.length} settings)`);

    return { tenant, adminUser };
  });

  console.log(`\nTenant "${args.name}" created successfully!`);
  console.log(`   Tenant ID: ${result.tenant.id}`);
  console.log(`   Admin Login: ${result.adminUser.email}`);
  console.log(`   Admin Password: (as provided)`);
}

createTenant(parseArgs())
  .catch((e) => {
    console.error(`\nError: ${e.message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
