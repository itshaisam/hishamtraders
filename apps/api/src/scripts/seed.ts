import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const roles = [
    { name: 'ADMIN', description: 'System administrator with full access' },
    { name: 'WAREHOUSE_MANAGER', description: 'Manages inventory and warehouse operations' },
    { name: 'SALES_OFFICER', description: 'Handles sales and customer orders' },
    { name: 'ACCOUNTANT', description: 'Manages financial records and accounting' },
    { name: 'RECOVERY_AGENT', description: 'Handles payment recovery and collections' },
  ];

  console.log('Creating roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✓ Roles created');

  // Get admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  // Create default admin user
  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  console.log('Creating default admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      passwordHash: hashedPassword,
      name: 'System Administrator',
      roleId: adminRole.id,
      status: 'active',
    },
  });

  console.log('✓ Default admin user created');
  console.log('\n📋 Default Admin Credentials:');
  console.log('   Email: admin@admin.com');
  console.log('   Password: admin123');
  console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!\n');

  // Create initial audit log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: adminUser.id,
      notes: 'Initial admin user created during database seed',
    },
  });

  console.log('✓ Initial audit log created');

  // ============ Seed Reference Data ============
  console.log('\n📍 Seeding reference data...');

  // Countries
  console.log('  Creating countries...');
  const countries = [
    { code: 'CN', name: 'China' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'FR', name: 'France' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SG', name: 'Singapore' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log('  ✓ Countries created (15 total)');

  // Payment Terms
  console.log('  Creating payment terms...');
  const paymentTerms = [
    { name: 'Net 30', days: 30, description: 'Payment due within 30 days' },
    { name: 'Net 60', days: 60, description: 'Payment due within 60 days' },
    { name: 'Net 90', days: 90, description: 'Payment due within 90 days' },
    { name: 'Cash on Delivery', days: 0, description: 'Payment due on delivery' },
    { name: 'Letter of Credit', description: 'Payment via letter of credit' },
    { name: '50% Advance + 50% on Delivery', days: 30, description: 'Half payment in advance, half on delivery' },
    { name: 'Full Payment in Advance', days: 0, description: 'Complete payment before shipment' },
    { name: '30% Advance + 70% on Delivery', days: 30, description: '30% upfront, 70% on delivery' },
  ];

  for (const term of paymentTerms) {
    await prisma.paymentTerm.upsert({
      where: { name: term.name },
      update: {},
      create: term,
    });
  }
  console.log('  ✓ Payment terms created (8 total)');

  // Product Categories
  console.log('  Creating product categories...');
  const categories = [
    { name: 'Sinks', description: 'Kitchen and bathroom sinks' },
    { name: 'Faucets', description: 'Taps and faucet fixtures' },
    { name: 'Toilets', description: 'Toilet fixtures and accessories' },
    { name: 'Showers', description: 'Shower units and showerheads' },
    { name: 'Accessories', description: 'Miscellaneous plumbing accessories' },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('  ✓ Product categories created (5 total)');

  // Brands
  console.log('  Creating brands...');
  const brands = [
    { name: 'SuperSink', country: 'China' },
    { name: 'EliteFaucet', country: 'Pakistan' },
    { name: 'ClassicToilet', country: 'China' },
    { name: 'DeluxeShower', country: 'China' },
    { name: 'PremiumAccessories', country: 'Germany' },
    { name: 'AquaFlow', country: 'India' },
    { name: 'LuxBath', country: 'Italy' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { name: brand.name },
      update: {},
      create: brand,
    });
  }
  console.log('  ✓ Brands created (7 total)');

  // Units of Measure
  console.log('  Creating units of measure...');
  const uoms = [
    { name: 'Piece', abbreviation: 'pc', description: 'Individual item or unit' },
    { name: 'Box', abbreviation: 'box', description: 'Standard box packaging' },
    { name: 'Case', abbreviation: 'cs', description: 'Case containing multiple units' },
    { name: 'Dozen', abbreviation: 'dz', description: '12 units' },
    { name: 'Pair', abbreviation: 'pr', description: 'Set of 2 items' },
    { name: 'Set', abbreviation: 'set', description: 'Complete set or kit' },
    { name: 'Pack', abbreviation: 'pk', description: 'Package or bundle' },
    { name: 'Meter', abbreviation: 'm', description: 'Metric unit of length' },
    { name: 'Kilogram', abbreviation: 'kg', description: 'Metric unit of weight' },
    { name: 'Liter', abbreviation: 'L', description: 'Metric unit of volume' },
    { name: 'Square Meter', abbreviation: 'sqm', description: 'Metric unit of area' },
    { name: 'Carton', abbreviation: 'ctn', description: 'Carton packaging' },
    { name: 'Bundle', abbreviation: 'bdl', description: 'Bundle of items' },
    { name: 'Roll', abbreviation: 'roll', description: 'Rolled material' },
  ];

  for (const uom of uoms) {
    await prisma.unitOfMeasure.upsert({
      where: { name: uom.name },
      update: {},
      create: uom,
    });
  }
  console.log('  ✓ Units of measure created (14 total)');

  // System Settings
  console.log('  Creating system settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'TAX_RATE' },
    update: {},
    create: {
      key: 'TAX_RATE',
      value: '18',
      dataType: 'number',
      label: 'Sales Tax Rate (%)',
      category: 'tax',
    },
  });
  await prisma.systemSetting.upsert({
    where: { key: 'COMPANY_NAME' },
    update: {},
    create: {
      key: 'COMPANY_NAME',
      value: 'Hisham Traders',
      dataType: 'string',
      label: 'Company Name',
      category: 'company',
    },
  });
  console.log('  ✓ System settings created (TAX_RATE=18%, COMPANY_NAME)');

  // ============ Seed Chart of Accounts (Epic 5) ============
  console.log('\n📊 Seeding Chart of Accounts...');

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

  // Create accounts in order (parents first)
  const accountIdMap: Record<string, string> = {};

  for (const acct of accountHeads) {
    const existing = await prisma.accountHead.findUnique({ where: { code: acct.code } });
    if (existing) {
      accountIdMap[acct.code] = existing.id;
      continue;
    }

    const parentId = acct.parentCode ? accountIdMap[acct.parentCode] : null;

    const created = await prisma.accountHead.create({
      data: {
        code: acct.code,
        name: acct.name,
        accountType: acct.accountType,
        parentId,
        isSystemAccount: acct.isSystemAccount,
        openingBalance: 0,
        currentBalance: 0,
      },
    });
    accountIdMap[acct.code] = created.id;
  }

  console.log(`  ✓ Chart of Accounts seeded (${accountHeads.length} accounts)`);

  console.log('\n✓ Reference data seeded successfully');
  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
