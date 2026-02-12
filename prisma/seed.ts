import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
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
    where: { email: 'admin@hishamtraders.com' },
    update: {},
    create: {
      email: 'admin@hishamtraders.com',
      passwordHash: hashedPassword,
      name: 'System Administrator',
      roleId: adminRole.id,
      status: 'active',
    },
  });

  console.log('✓ Default admin user created');
  console.log('\n📋 Default Admin Credentials:');
  console.log('   Email: admin@hishamtraders.com');
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
  console.log('  ✓ Countries created');

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
  console.log('  ✓ Payment terms created');

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
  console.log('  ✓ Product categories created');

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
  console.log('  ✓ Brands created');

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
  console.log('  ✓ Units of measure created');

  // Get reference data for relationships
  const chinaCountry = await prisma.country.findUnique({ where: { code: 'CN' } });
  const pakistanCountry = await prisma.country.findUnique({ where: { code: 'PK' } });
  const net30 = await prisma.paymentTerm.findUnique({ where: { name: 'Net 30' } });
  const cod = await prisma.paymentTerm.findUnique({ where: { name: 'Cash on Delivery' } });
  const sinksCategory = await prisma.productCategory.findUnique({ where: { name: 'Sinks' } });
  const faucetsCategory = await prisma.productCategory.findUnique({ where: { name: 'Faucets' } });
  const toiletsCategory = await prisma.productCategory.findUnique({ where: { name: 'Toilets' } });
  const superSinkBrand = await prisma.brand.findUnique({ where: { name: 'SuperSink' } });
  const eliteFaucetBrand = await prisma.brand.findUnique({ where: { name: 'EliteFaucet' } });
  const classicToiletBrand = await prisma.brand.findUnique({ where: { name: 'ClassicToilet' } });
  const pieceUom = await prisma.unitOfMeasure.findUnique({ where: { name: 'Piece' } });
  const setUom = await prisma.unitOfMeasure.findUnique({ where: { name: 'Set' } });

  // Sample Suppliers
  console.log('  Creating sample suppliers...');
  const suppliers = [
    {
      name: 'Beijing Ceramics Co.',
      countryId: chinaCountry?.id,
      paymentTermId: net30?.id,
      contactPerson: 'Wang Chen',
      email: 'wang@ceramics.cn',
      phone: '+86-10-1234-5678',
      address: 'Beijing, China',
    },
    {
      name: 'Karachi Fixtures Ltd.',
      countryId: pakistanCountry?.id,
      paymentTermId: cod?.id,
      contactPerson: 'Ahmed Khan',
      email: 'ahmed@karachifix.pk',
      phone: '+92-21-3456-7890',
      address: 'Karachi, Pakistan',
    },
    {
      name: 'Shanghai Bathroom Supplies',
      countryId: chinaCountry?.id,
      paymentTermId: net30?.id,
      contactPerson: 'Li Wei',
      email: 'li@shbathroom.cn',
      phone: '+86-21-5678-9012',
      address: 'Shanghai, China',
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      update: {},
      create: supplier,
    });
  }
  console.log('  ✓ Sample suppliers created');

  // Sample Products
  console.log('  Creating sample products...');
  const products = [
    {
      sku: 'SINK-001',
      name: 'Stainless Steel Kitchen Sink 33x22',
      categoryId: sinksCategory?.id,
      brandId: superSinkBrand?.id,
      uomId: pieceUom?.id,
      costPrice: new Decimal('150.00'),
      sellingPrice: new Decimal('250.00'),
      reorderLevel: 10,
    },
    {
      sku: 'SINK-002',
      name: 'Double Bowl Undermount Sink',
      categoryId: sinksCategory?.id,
      brandId: superSinkBrand?.id,
      uomId: pieceUom?.id,
      costPrice: new Decimal('200.00'),
      sellingPrice: new Decimal('350.00'),
      reorderLevel: 8,
    },
    {
      sku: 'FAUCET-001',
      name: 'Chrome Kitchen Faucet with Sprayer',
      categoryId: faucetsCategory?.id,
      brandId: eliteFaucetBrand?.id,
      uomId: setUom?.id,
      costPrice: new Decimal('75.00'),
      sellingPrice: new Decimal('125.00'),
      reorderLevel: 20,
    },
    {
      sku: 'FAUCET-002',
      name: 'Brass Basin Faucet Hot/Cold',
      categoryId: faucetsCategory?.id,
      brandId: eliteFaucetBrand?.id,
      uomId: pieceUom?.id,
      costPrice: new Decimal('45.00'),
      sellingPrice: new Decimal('85.00'),
      reorderLevel: 25,
    },
    {
      sku: 'TOILET-001',
      name: 'Ceramic Western Toilet Seat',
      categoryId: toiletsCategory?.id,
      brandId: classicToiletBrand?.id,
      uomId: setUom?.id,
      costPrice: new Decimal('120.00'),
      sellingPrice: new Decimal('200.00'),
      reorderLevel: 10,
    },
    {
      sku: 'TOILET-002',
      name: 'Dual Flush Toilet with Soft Close',
      categoryId: toiletsCategory?.id,
      brandId: classicToiletBrand?.id,
      uomId: setUom?.id,
      costPrice: new Decimal('180.00'),
      sellingPrice: new Decimal('320.00'),
      reorderLevel: 8,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log('  ✓ Sample products created');

  // Step 9: Sample Warehouses
  console.log('9. Creating sample warehouses...');
  const warehouses = [
    {
      name: 'Main Warehouse - Karachi',
      location: 'Industrial Area, SITE, Karachi',
      city: 'karachi',
      status: 'ACTIVE' as const,
      createdBy: adminUser.id,
    },
    {
      name: 'Islamabad Branch Warehouse',
      location: 'I-9 Industrial Area, Islamabad',
      city: 'islamabad',
      status: 'ACTIVE' as const,
      createdBy: adminUser.id,
    },
  ];

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { name: warehouse.name },
      update: {},
      create: warehouse,
    });
  }
  console.log('  ✓ Sample warehouses created');

  // Step 10: Sample Inventory Records
  console.log('10. Creating sample inventory records...');
  const mainWarehouse = await prisma.warehouse.findFirst({
    where: { name: 'Main Warehouse - Karachi' }
  });
  const sinkProduct = await prisma.product.findUnique({
    where: { sku: 'SINK-001' }
  });
  const faucetProduct = await prisma.product.findUnique({
    where: { sku: 'FAUCET-001' }
  });

  if (mainWarehouse && sinkProduct) {
    // Create inventory record if doesn't exist
    const existing = await prisma.inventory.findFirst({
      where: {
        productId: sinkProduct.id,
        productVariantId: null,
        warehouseId: mainWarehouse.id,
        batchNo: 'SEED-BATCH-001',
      },
    });

    if (!existing) {
      await prisma.inventory.create({
        data: {
          productId: sinkProduct.id,
          productVariantId: null,
          warehouseId: mainWarehouse.id,
          quantity: 50,
          batchNo: 'SEED-BATCH-001',
          binLocation: 'A-01-001',
        },
      });
    }

    // Create stock movement record to show origin
    await prisma.stockMovement.create({
      data: {
        productId: sinkProduct.id,
        warehouseId: mainWarehouse.id,
        movementType: 'RECEIPT',
        quantity: 50,
        referenceType: 'ADJUSTMENT',
        referenceId: 'SEED-INIT',
        userId: adminUser.id,
        notes: 'Initial seed inventory for demo purposes',
      },
    });
  }

  if (mainWarehouse && faucetProduct) {
    // Create inventory record (low stock example) if doesn't exist
    const existing = await prisma.inventory.findFirst({
      where: {
        productId: faucetProduct.id,
        productVariantId: null,
        warehouseId: mainWarehouse.id,
        batchNo: 'SEED-BATCH-002',
      },
    });

    if (!existing) {
      await prisma.inventory.create({
        data: {
          productId: faucetProduct.id,
          productVariantId: null,
          warehouseId: mainWarehouse.id,
          quantity: 8, // Low stock to demonstrate alert
          batchNo: 'SEED-BATCH-002',
          binLocation: 'A-01-002',
        },
      });
    }

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        productId: faucetProduct.id,
        warehouseId: mainWarehouse.id,
        movementType: 'RECEIPT',
        quantity: 8,
        referenceType: 'ADJUSTMENT',
        referenceId: 'SEED-INIT',
        userId: adminUser.id,
        notes: 'Initial seed inventory - low stock example for demo',
      },
    });
  }

  console.log('  ✓ Sample inventory created with stock movement history');

  // Step 11: Sample Clients
  console.log('11. Creating sample clients...');
  const clients = [
    {
      name: 'ABC Construction Ltd.',
      contactPerson: 'Ali Ahmed',
      email: 'ali@abcconstruction.pk',
      phone: '+92-300-1234567',
      city: 'Lahore',
      area: 'Gulberg',
      creditLimit: new Decimal('500000.00'),
      balance: new Decimal('120000.00'),
      paymentTermsDays: 30,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Paradise Builders',
      contactPerson: 'Hassan Malik',
      email: 'hassan@paradisebuilders.pk',
      phone: '+92-321-9876543',
      city: 'Karachi',
      area: 'DHA',
      creditLimit: new Decimal('1000000.00'),
      balance: new Decimal('250000.00'),
      paymentTermsDays: 45,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Metro Plumbing Services',
      contactPerson: 'Tariq Khan',
      email: 'tariq@metroplumbing.pk',
      phone: '+92-333-4567890',
      city: 'Islamabad',
      area: 'F-7 Markaz',
      creditLimit: new Decimal('300000.00'),
      balance: new Decimal('50000.00'),
      paymentTermsDays: 15,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Royal Interiors',
      contactPerson: 'Sana Iqbal',
      email: 'sana@royalinteriors.pk',
      phone: '+92-345-7890123',
      city: 'Lahore',
      area: 'MM Alam Road',
      creditLimit: new Decimal('750000.00'),
      balance: new Decimal('680000.00'), // Close to limit (90% utilization)
      paymentTermsDays: 30,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Green Valley Homes',
      contactPerson: 'Kamran Shah',
      email: 'kamran@greenvalley.pk',
      phone: '+92-300-2345678',
      city: 'Islamabad',
      area: 'Blue Area',
      creditLimit: new Decimal('200000.00'),
      balance: new Decimal('220000.00'), // Over limit - good for testing override
      paymentTermsDays: 20,
      status: 'ACTIVE' as const,
    },
    {
      name: 'City Mart Retail',
      contactPerson: 'Zainab Hussain',
      email: 'zainab@citymart.pk',
      phone: '+92-321-3456789',
      city: 'Karachi',
      area: 'Zamzama Boulevard',
      creditLimit: new Decimal('150000.00'),
      balance: new Decimal('0.00'), // Zero balance - clean account
      paymentTermsDays: 7,
      status: 'ACTIVE' as const,
    },
    {
      name: 'Skyline Developers (Inactive)',
      contactPerson: 'Umer Farooq',
      email: 'umer@skylinedev.pk',
      phone: '+92-333-5678901',
      city: 'Faisalabad',
      area: 'Civic Center',
      creditLimit: new Decimal('100000.00'),
      balance: new Decimal('15000.00'),
      paymentTermsDays: 30,
      status: 'INACTIVE' as const, // Inactive client for testing
    },
  ];

  for (const client of clients) {
    const existing = await prisma.client.findFirst({
      where: { name: client.name },
    });

    if (!existing) {
      await prisma.client.create({
        data: client,
      });
    }
  }
  console.log('  ✓ Sample clients created (7 clients with various scenarios)');

  // Step 12: System Settings
  console.log('12. Creating system settings...');
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
  console.log('  ✓ System settings created (TAX_RATE=18%)');

  // ============ Seed Chart of Accounts (Epic 5) ============
  console.log('\n📊 Seeding Chart of Accounts...');

  const accountHeads = [
    // ASSETS (1xxx)
    { code: '1000', name: 'Assets', accountType: 'ASSET' as const, parentCode: null, isSystemAccount: true },
    { code: '1100', name: 'Bank Accounts', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: true },
    { code: '1101', name: 'Main Bank Account', accountType: 'ASSET' as const, parentCode: '1100', isSystemAccount: true },
    { code: '1102', name: 'Petty Cash', accountType: 'ASSET' as const, parentCode: '1100', isSystemAccount: true },
    { code: '1200', name: 'Accounts Receivable', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: true },
    { code: '1300', name: 'Inventory', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: true },
    { code: '1400', name: 'Fixed Assets', accountType: 'ASSET' as const, parentCode: '1000', isSystemAccount: false },

    // LIABILITIES (2xxx)
    { code: '2000', name: 'Liabilities', accountType: 'LIABILITY' as const, parentCode: null, isSystemAccount: true },
    { code: '2100', name: 'Accounts Payable', accountType: 'LIABILITY' as const, parentCode: '2000', isSystemAccount: true },
    { code: '2200', name: 'Tax Payable', accountType: 'LIABILITY' as const, parentCode: '2000', isSystemAccount: true },
    { code: '2300', name: 'Loans Payable', accountType: 'LIABILITY' as const, parentCode: '2000', isSystemAccount: false },

    // EQUITY (3xxx)
    { code: '3000', name: 'Equity', accountType: 'EQUITY' as const, parentCode: null, isSystemAccount: true },
    { code: '3100', name: "Owner's Capital", accountType: 'EQUITY' as const, parentCode: '3000', isSystemAccount: true },
    { code: '3200', name: 'Retained Earnings', accountType: 'EQUITY' as const, parentCode: '3000', isSystemAccount: true },

    // REVENUE (4xxx)
    { code: '4000', name: 'Revenue', accountType: 'REVENUE' as const, parentCode: null, isSystemAccount: true },
    { code: '4100', name: 'Sales Revenue', accountType: 'REVENUE' as const, parentCode: '4000', isSystemAccount: true },
    { code: '4200', name: 'Other Income', accountType: 'REVENUE' as const, parentCode: '4000', isSystemAccount: false },

    // EXPENSES (5xxx)
    { code: '5000', name: 'Expenses', accountType: 'EXPENSE' as const, parentCode: null, isSystemAccount: true },
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

  console.log(`  ✓ ${accountHeads.length} account heads seeded`);

  console.log('✓ Reference data seeded successfully');
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
