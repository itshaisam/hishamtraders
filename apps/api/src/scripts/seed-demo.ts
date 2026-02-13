import { PrismaClient, AccountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const daysAgo = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - d);
  return dt;
};
const daysFromNow = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + d);
  return dt;
};

function calculateBalanceChange(accountType: AccountType, debit: number, credit: number): number {
  const isDebitNormal = accountType === 'ASSET' || accountType === 'EXPENSE';
  return isDebitNormal ? debit - credit : credit - debit;
}

// Track used journal numbers per date-prefix to avoid collisions
const journalSeqMap: Record<string, number> = {};

async function nextJournalNumber(tx: any, date: Date): Promise<string> {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const prefix = `JE-${y}${m}${d}-`;

  if (!(prefix in journalSeqMap)) {
    // Find the highest existing entry number with this prefix
    const latest = await tx.journalEntry.findFirst({
      where: { entryNumber: { startsWith: prefix } },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });
    if (latest) {
      const parts = latest.entryNumber.split('-');
      journalSeqMap[prefix] = parseInt(parts[parts.length - 1], 10);
    } else {
      journalSeqMap[prefix] = 0;
    }
  }

  journalSeqMap[prefix]++;
  return `${prefix}${String(journalSeqMap[prefix]).padStart(3, '0')}`;
}

/** Create a POSTED journal entry and update account balances (mirrors AutoJournalService) */
async function createJournalEntry(
  tx: any,
  opts: {
    date: Date;
    description: string;
    referenceType: string;
    referenceId: string;
    userId: string;
    lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }>;
  }
) {
  const resolvedLines: Array<{
    accountHeadId: string;
    accountType: AccountType;
    debitAmount: number;
    creditAmount: number;
    description: string | null;
  }> = [];

  for (const line of opts.lines) {
    const account = await tx.accountHead.findFirst({ where: { code: line.accountCode }, select: { id: true, accountType: true } });
    if (!account) {
      console.log(`    ⚠ Account ${line.accountCode} not found, skipping JE: ${opts.description}`);
      return null;
    }
    resolvedLines.push({
      accountHeadId: account.id,
      accountType: account.accountType,
      debitAmount: Math.round(line.debit * 100) / 100,
      creditAmount: Math.round(line.credit * 100) / 100,
      description: line.description || null,
    });
  }

  const entryNumber = await nextJournalNumber(tx, opts.date);

  await tx.journalEntry.create({
    data: {
      entryNumber,
      date: opts.date,
      description: opts.description,
      status: 'POSTED',
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      createdBy: opts.userId,
      approvedBy: opts.userId,
      lines: {
        create: resolvedLines.map((l) => ({
          accountHeadId: l.accountHeadId,
          debitAmount: l.debitAmount,
          creditAmount: l.creditAmount,
          description: l.description,
        })),
      },
    },
  });

  // Update account balances
  for (const line of resolvedLines) {
    const balanceChange = calculateBalanceChange(line.accountType, line.debitAmount, line.creditAmount);
    await tx.accountHead.update({
      where: { id: line.accountHeadId },
      data: { currentBalance: { increment: balanceChange } },
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// Main seed
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎭 Starting COMPREHENSIVE demo data seed...');
  console.log('   This creates realistic data for ALL modules.\n');

  // ============ Get base data ============
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } });
  if (!adminUser) throw new Error('Admin user not found. Run base seed first: pnpm db:seed');

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const warehouseManagerRole = await prisma.role.findUnique({ where: { name: 'WAREHOUSE_MANAGER' } });
  const salesOfficerRole = await prisma.role.findUnique({ where: { name: 'SALES_OFFICER' } });
  const accountantRole = await prisma.role.findUnique({ where: { name: 'ACCOUNTANT' } });
  const recoveryAgentRole = await prisma.role.findUnique({ where: { name: 'RECOVERY_AGENT' } });

  if (!adminRole || !warehouseManagerRole || !salesOfficerRole || !accountantRole || !recoveryAgentRole) {
    throw new Error('Roles not found. Run base seed first.');
  }

  // ============ Additional Users ============
  console.log('👥 Creating additional users...');
  const bcrypt = await import('bcrypt');
  const demoHash = await bcrypt.hash('demo123', 10);

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@hishamtraders.pk' },
    update: {},
    create: {
      email: 'warehouse@hishamtraders.pk',
      passwordHash: demoHash,
      name: 'Asad Khan (Warehouse)',
      roleId: warehouseManagerRole.id,
      status: 'active',
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@hishamtraders.pk' },
    update: {},
    create: {
      email: 'sales@hishamtraders.pk',
      passwordHash: demoHash,
      name: 'Bilal Ahmed (Sales)',
      roleId: salesOfficerRole.id,
      status: 'active',
    },
  });

  const accountantUser = await prisma.user.upsert({
    where: { email: 'accounts@hishamtraders.pk' },
    update: {},
    create: {
      email: 'accounts@hishamtraders.pk',
      passwordHash: demoHash,
      name: 'Farah Naz (Accounts)',
      roleId: accountantRole.id,
      status: 'active',
    },
  });

  const recoveryUser = await prisma.user.upsert({
    where: { email: 'recovery@hishamtraders.pk' },
    update: {},
    create: {
      email: 'recovery@hishamtraders.pk',
      passwordHash: demoHash,
      name: 'Imran Qureshi (Recovery)',
      roleId: recoveryAgentRole.id,
      status: 'active',
    },
  });
  console.log('  ✓ 4 demo users created (password: demo123)');

  // ============ Reference data lookups ============
  const chinaCountry = await prisma.country.findUnique({ where: { code: 'CN' } });
  const pakistanCountry = await prisma.country.findUnique({ where: { code: 'PK' } });
  const indiaCountry = await prisma.country.findUnique({ where: { code: 'IN' } });
  const net30 = await prisma.paymentTerm.findUnique({ where: { name: 'Net 30' } });
  const net60 = await prisma.paymentTerm.findUnique({ where: { name: 'Net 60' } });
  const cod = await prisma.paymentTerm.findUnique({ where: { name: 'Cash on Delivery' } });

  const sinksCategory = await prisma.productCategory.findUnique({ where: { name: 'Sinks' } });
  const faucetsCategory = await prisma.productCategory.findUnique({ where: { name: 'Faucets' } });
  const toiletsCategory = await prisma.productCategory.findUnique({ where: { name: 'Toilets' } });
  const showersCategory = await prisma.productCategory.findUnique({ where: { name: 'Showers' } });
  const accessoriesCategory = await prisma.productCategory.findUnique({ where: { name: 'Accessories' } });

  const superSinkBrand = await prisma.brand.findUnique({ where: { name: 'SuperSink' } });
  const eliteFaucetBrand = await prisma.brand.findUnique({ where: { name: 'EliteFaucet' } });
  const classicToiletBrand = await prisma.brand.findUnique({ where: { name: 'ClassicToilet' } });
  const deluxeShowerBrand = await prisma.brand.findUnique({ where: { name: 'DeluxeShower' } });
  const premiumAccessBrand = await prisma.brand.findUnique({ where: { name: 'PremiumAccessories' } });
  const aquaFlowBrand = await prisma.brand.findUnique({ where: { name: 'AquaFlow' } });
  const luxBathBrand = await prisma.brand.findUnique({ where: { name: 'LuxBath' } });

  const pieceUom = await prisma.unitOfMeasure.findUnique({ where: { name: 'Piece' } });
  const setUom = await prisma.unitOfMeasure.findUnique({ where: { name: 'Set' } });

  // ============ Suppliers ============
  console.log('\n🏭 Creating suppliers...');
  const suppliers = [
    {
      name: 'Beijing Ceramics Co.',
      countryId: chinaCountry?.id,
      paymentTermId: net30?.id,
      contactPerson: 'Wang Chen',
      email: 'wang@ceramics.cn',
      phone: '+86-10-1234-5678',
      address: 'No. 88 Industrial Rd, Chaoyang District, Beijing, China',
    },
    {
      name: 'Karachi Fixtures Ltd.',
      countryId: pakistanCountry?.id,
      paymentTermId: cod?.id,
      contactPerson: 'Ahmed Khan',
      email: 'ahmed@karachifix.pk',
      phone: '+92-21-3456-7890',
      address: 'Plot 45, SITE Industrial Area, Karachi, Pakistan',
    },
    {
      name: 'Shanghai Bathroom Supplies',
      countryId: chinaCountry?.id,
      paymentTermId: net30?.id,
      contactPerson: 'Li Wei',
      email: 'li@shbathroom.cn',
      phone: '+86-21-5678-9012',
      address: '56 Pudong New Area, Shanghai, China',
    },
    {
      name: 'Delhi Premium Fittings',
      countryId: indiaCountry?.id,
      paymentTermId: net60?.id,
      contactPerson: 'Raj Patel',
      email: 'raj@delhifittings.in',
      phone: '+91-11-4567-8901',
      address: 'Sector 18, Noida, Delhi NCR, India',
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      update: {},
      create: supplier,
    });
  }
  console.log('  ✓ Suppliers created (4 total)');

  // ============ Products (10 products across all 5 categories) ============
  console.log('\n📦 Creating products...');
  const productsData = [
    // Sinks (2)
    { sku: 'SINK-001', name: 'Stainless Steel Kitchen Sink 33x22', categoryId: sinksCategory?.id, brandId: superSinkBrand?.id, uomId: pieceUom?.id, costPrice: new Decimal('150.00'), sellingPrice: new Decimal('250.00'), reorderLevel: 10 },
    { sku: 'SINK-002', name: 'Double Bowl Undermount Sink', categoryId: sinksCategory?.id, brandId: luxBathBrand?.id, uomId: pieceUom?.id, costPrice: new Decimal('200.00'), sellingPrice: new Decimal('350.00'), reorderLevel: 8 },
    // Faucets (2)
    { sku: 'FAUCET-001', name: 'Chrome Kitchen Faucet with Sprayer', categoryId: faucetsCategory?.id, brandId: eliteFaucetBrand?.id, uomId: setUom?.id, costPrice: new Decimal('75.00'), sellingPrice: new Decimal('125.00'), reorderLevel: 20 },
    { sku: 'FAUCET-002', name: 'Brass Basin Faucet Hot/Cold', categoryId: faucetsCategory?.id, brandId: aquaFlowBrand?.id, uomId: pieceUom?.id, costPrice: new Decimal('45.00'), sellingPrice: new Decimal('85.00'), reorderLevel: 25 },
    // Toilets (2)
    { sku: 'TOILET-001', name: 'Ceramic Western Toilet Seat', categoryId: toiletsCategory?.id, brandId: classicToiletBrand?.id, uomId: setUom?.id, costPrice: new Decimal('120.00'), sellingPrice: new Decimal('200.00'), reorderLevel: 10 },
    { sku: 'TOILET-002', name: 'Dual Flush Toilet with Soft Close', categoryId: toiletsCategory?.id, brandId: classicToiletBrand?.id, uomId: setUom?.id, costPrice: new Decimal('180.00'), sellingPrice: new Decimal('320.00'), reorderLevel: 8 },
    // Showers (2)
    { sku: 'SHOWER-001', name: 'Rain Shower Head 12 inch Chrome', categoryId: showersCategory?.id, brandId: deluxeShowerBrand?.id, uomId: pieceUom?.id, costPrice: new Decimal('90.00'), sellingPrice: new Decimal('160.00'), reorderLevel: 15 },
    { sku: 'SHOWER-002', name: 'Complete Shower Panel System', categoryId: showersCategory?.id, brandId: luxBathBrand?.id, uomId: setUom?.id, costPrice: new Decimal('250.00'), sellingPrice: new Decimal('450.00'), reorderLevel: 5 },
    // Accessories (2)
    { sku: 'ACC-001', name: 'Towel Bar Set (24 inch)', categoryId: accessoriesCategory?.id, brandId: premiumAccessBrand?.id, uomId: setUom?.id, costPrice: new Decimal('25.00'), sellingPrice: new Decimal('55.00'), reorderLevel: 30 },
    { sku: 'ACC-002', name: 'Soap Dispenser Wall Mount', categoryId: accessoriesCategory?.id, brandId: premiumAccessBrand?.id, uomId: pieceUom?.id, costPrice: new Decimal('15.00'), sellingPrice: new Decimal('35.00'), reorderLevel: 40 },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log('  ✓ Products created (10 across 5 categories)');

  // Re-fetch products
  const p = {
    SINK001: (await prisma.product.findUnique({ where: { sku: 'SINK-001' } }))!,
    SINK002: (await prisma.product.findUnique({ where: { sku: 'SINK-002' } }))!,
    FAUCET001: (await prisma.product.findUnique({ where: { sku: 'FAUCET-001' } }))!,
    FAUCET002: (await prisma.product.findUnique({ where: { sku: 'FAUCET-002' } }))!,
    TOILET001: (await prisma.product.findUnique({ where: { sku: 'TOILET-001' } }))!,
    TOILET002: (await prisma.product.findUnique({ where: { sku: 'TOILET-002' } }))!,
    SHOWER001: (await prisma.product.findUnique({ where: { sku: 'SHOWER-001' } }))!,
    SHOWER002: (await prisma.product.findUnique({ where: { sku: 'SHOWER-002' } }))!,
    ACC001: (await prisma.product.findUnique({ where: { sku: 'ACC-001' } }))!,
    ACC002: (await prisma.product.findUnique({ where: { sku: 'ACC-002' } }))!,
  };

  // ============ Warehouses ============
  console.log('\n🏢 Creating warehouses...');
  for (const wh of [
    { name: 'Main Warehouse - Karachi', location: 'Industrial Area, SITE, Karachi', city: 'karachi', status: 'ACTIVE' as const, createdBy: adminUser.id },
    { name: 'Islamabad Branch Warehouse', location: 'I-9 Industrial Area, Islamabad', city: 'islamabad', status: 'ACTIVE' as const, createdBy: adminUser.id },
  ]) {
    await prisma.warehouse.upsert({ where: { name: wh.name }, update: {}, create: wh });
  }
  const w1 = (await prisma.warehouse.findFirst({ where: { name: 'Main Warehouse - Karachi' } }))!;
  const w2 = (await prisma.warehouse.findFirst({ where: { name: 'Islamabad Branch Warehouse' } }))!;
  console.log('  ✓ 2 warehouses created');

  // ============ Bin Locations ============
  console.log('\n📍 Creating bin locations...');
  const binLocations = [
    // Karachi warehouse
    { warehouseId: w1.id, code: 'A-01-001', zone: 'A', description: 'Sinks aisle 1' },
    { warehouseId: w1.id, code: 'A-01-002', zone: 'A', description: 'Sinks aisle 2' },
    { warehouseId: w1.id, code: 'B-01-001', zone: 'B', description: 'Faucets rack 1' },
    { warehouseId: w1.id, code: 'B-01-002', zone: 'B', description: 'Faucets rack 2' },
    { warehouseId: w1.id, code: 'C-01-001', zone: 'C', description: 'Toilets section' },
    { warehouseId: w1.id, code: 'D-01-001', zone: 'D', description: 'Showers section' },
    { warehouseId: w1.id, code: 'E-01-001', zone: 'E', description: 'Accessories section' },
    // Islamabad warehouse
    { warehouseId: w2.id, code: 'A-01-001', zone: 'A', description: 'Main storage area' },
    { warehouseId: w2.id, code: 'B-01-001', zone: 'B', description: 'Secondary area' },
    { warehouseId: w2.id, code: 'C-01-001', zone: 'C', description: 'Overflow storage' },
  ];

  for (const bin of binLocations) {
    const existing = await prisma.binLocation.findFirst({
      where: { warehouseId: bin.warehouseId, code: bin.code },
    });
    if (!existing) {
      await prisma.binLocation.create({ data: bin });
    }
  }
  console.log('  ✓ 10 bin locations created');

  // ============ Inventory — ALL products in BOTH warehouses ============
  console.log('\n📊 Creating inventory for ALL products in BOTH warehouses...');

  const inventoryData: Array<{
    productId: string;
    warehouseId: string;
    quantity: number;
    batchNo: string;
    binLocation: string;
  }> = [
    // Karachi warehouse (main, higher stock)
    { productId: p.SINK001.id, warehouseId: w1.id, quantity: 50, batchNo: 'BJ-2025-001', binLocation: 'A-01-001' },
    { productId: p.SINK002.id, warehouseId: w1.id, quantity: 30, batchNo: 'LB-2025-001', binLocation: 'A-01-002' },
    { productId: p.FAUCET001.id, warehouseId: w1.id, quantity: 80, batchNo: 'KF-2025-001', binLocation: 'B-01-001' },
    { productId: p.FAUCET002.id, warehouseId: w1.id, quantity: 100, batchNo: 'KF-2025-002', binLocation: 'B-01-002' },
    { productId: p.TOILET001.id, warehouseId: w1.id, quantity: 25, batchNo: 'SH-2025-001', binLocation: 'C-01-001' },
    { productId: p.TOILET002.id, warehouseId: w1.id, quantity: 20, batchNo: 'SH-2025-002', binLocation: 'C-01-001' },
    { productId: p.SHOWER001.id, warehouseId: w1.id, quantity: 40, batchNo: 'DS-2025-001', binLocation: 'D-01-001' },
    { productId: p.SHOWER002.id, warehouseId: w1.id, quantity: 12, batchNo: 'LB-2025-002', binLocation: 'D-01-001' },
    { productId: p.ACC001.id, warehouseId: w1.id, quantity: 120, batchNo: 'PA-2025-001', binLocation: 'E-01-001' },
    { productId: p.ACC002.id, warehouseId: w1.id, quantity: 200, batchNo: 'PA-2025-002', binLocation: 'E-01-001' },
    // Islamabad warehouse (branch, lower stock)
    { productId: p.SINK001.id, warehouseId: w2.id, quantity: 15, batchNo: 'BJ-2025-001', binLocation: 'A-01-001' },
    { productId: p.SINK002.id, warehouseId: w2.id, quantity: 10, batchNo: 'LB-2025-001', binLocation: 'A-01-001' },
    { productId: p.FAUCET001.id, warehouseId: w2.id, quantity: 30, batchNo: 'KF-2025-001', binLocation: 'B-01-001' },
    { productId: p.FAUCET002.id, warehouseId: w2.id, quantity: 45, batchNo: 'KF-2025-002', binLocation: 'B-01-001' },
    { productId: p.TOILET001.id, warehouseId: w2.id, quantity: 10, batchNo: 'SH-2025-001', binLocation: 'C-01-001' },
    { productId: p.TOILET002.id, warehouseId: w2.id, quantity: 8, batchNo: 'SH-2025-002', binLocation: 'C-01-001' },
    { productId: p.SHOWER001.id, warehouseId: w2.id, quantity: 20, batchNo: 'DS-2025-001', binLocation: 'A-01-001' },
    { productId: p.SHOWER002.id, warehouseId: w2.id, quantity: 5, batchNo: 'LB-2025-002', binLocation: 'A-01-001' },
    { productId: p.ACC001.id, warehouseId: w2.id, quantity: 50, batchNo: 'PA-2025-001', binLocation: 'B-01-001' },
    { productId: p.ACC002.id, warehouseId: w2.id, quantity: 80, batchNo: 'PA-2025-002', binLocation: 'B-01-001' },
  ];

  for (const inv of inventoryData) {
    const existing = await prisma.inventory.findFirst({
      where: { productId: inv.productId, warehouseId: inv.warehouseId, batchNo: inv.batchNo, productVariantId: null },
    });
    if (!existing) {
      await prisma.inventory.create({ data: { ...inv, productVariantId: null } });
      await prisma.stockMovement.create({
        data: {
          productId: inv.productId,
          warehouseId: inv.warehouseId,
          movementType: 'RECEIPT',
          quantity: inv.quantity,
          referenceType: 'ADJUSTMENT',
          referenceId: 'SEED-INIT',
          userId: adminUser.id,
          notes: 'Initial inventory — demo seed',
        },
      });
    }
  }
  console.log('  ✓ 20 inventory records created (10 products × 2 warehouses)');

  // ============ Clients ============
  console.log('\n👤 Creating clients...');
  const clientsData = [
    { name: 'ABC Construction Ltd.', contactPerson: 'Ali Ahmed', phone: '+92-300-1234567', email: 'ali@abcconstruction.pk', city: 'Lahore', area: 'Gulberg', creditLimit: new Decimal('500000'), balance: new Decimal('0'), paymentTermsDays: 30, status: 'ACTIVE' as const, recoveryDay: 'MONDAY' as const, whatsapp: '+92-300-1234567' },
    { name: 'Paradise Builders', contactPerson: 'Hassan Malik', phone: '+92-321-9876543', email: 'hassan@paradisebuilders.pk', city: 'Karachi', area: 'DHA', creditLimit: new Decimal('1000000'), balance: new Decimal('0'), paymentTermsDays: 45, status: 'ACTIVE' as const, recoveryDay: 'TUESDAY' as const, whatsapp: '+92-321-9876543' },
    { name: 'Metro Plumbing Services', contactPerson: 'Tariq Khan', phone: '+92-333-4567890', email: 'tariq@metroplumbing.pk', city: 'Islamabad', area: 'F-7 Markaz', creditLimit: new Decimal('300000'), balance: new Decimal('0'), paymentTermsDays: 15, status: 'ACTIVE' as const, recoveryDay: 'WEDNESDAY' as const },
    { name: 'Royal Interiors', contactPerson: 'Sana Iqbal', phone: '+92-345-7890123', email: 'sana@royalinteriors.pk', city: 'Lahore', area: 'MM Alam Road', creditLimit: new Decimal('750000'), balance: new Decimal('0'), paymentTermsDays: 30, status: 'ACTIVE' as const, recoveryDay: 'THURSDAY' as const },
    { name: 'Green Valley Homes', contactPerson: 'Kamran Shah', phone: '+92-300-2345678', email: 'kamran@greenvalley.pk', city: 'Islamabad', area: 'Blue Area', creditLimit: new Decimal('200000'), balance: new Decimal('0'), paymentTermsDays: 20, status: 'ACTIVE' as const, recoveryDay: 'FRIDAY' as const },
    { name: 'City Mart Retail', contactPerson: 'Zainab Hussain', phone: '+92-321-3456789', email: 'zainab@citymart.pk', city: 'Karachi', area: 'Zamzama Boulevard', creditLimit: new Decimal('150000'), balance: new Decimal('0'), paymentTermsDays: 7, status: 'ACTIVE' as const, recoveryDay: 'SATURDAY' as const },
    { name: 'Skyline Developers', contactPerson: 'Umer Farooq', phone: '+92-333-5678901', email: 'umer@skylinedev.pk', city: 'Faisalabad', area: 'Civic Center', creditLimit: new Decimal('100000'), balance: new Decimal('0'), paymentTermsDays: 30, status: 'INACTIVE' as const, recoveryDay: 'NONE' as const },
  ];

  for (const client of clientsData) {
    const existing = await prisma.client.findFirst({ where: { name: client.name } });
    if (!existing) {
      await prisma.client.create({ data: { ...client, recoveryAgentId: recoveryUser.id } });
    } else {
      // Update recovery assignment
      await prisma.client.update({
        where: { id: existing.id },
        data: { recoveryDay: client.recoveryDay, recoveryAgentId: client.status === 'ACTIVE' ? recoveryUser.id : null },
      });
    }
  }
  console.log('  ✓ 7 clients created with recovery day assignments');

  // Fetch clients
  const c1 = (await prisma.client.findFirst({ where: { name: { startsWith: 'ABC Construction' } } }))!;
  const c2 = (await prisma.client.findFirst({ where: { name: { startsWith: 'Paradise Builders' } } }))!;
  const c3 = (await prisma.client.findFirst({ where: { name: { startsWith: 'Metro Plumbing' } } }))!;
  const c4 = (await prisma.client.findFirst({ where: { name: { startsWith: 'Royal Interiors' } } }))!;
  const c5 = (await prisma.client.findFirst({ where: { name: { startsWith: 'Green Valley' } } }))!;
  const c6 = (await prisma.client.findFirst({ where: { name: { startsWith: 'City Mart' } } }))!;

  // ============ Purchase Orders ============
  console.log('\n📋 Creating purchase orders...');
  const beijingSupplier = (await prisma.supplier.findUnique({ where: { name: 'Beijing Ceramics Co.' } }))!;
  const karachiSupplier = (await prisma.supplier.findUnique({ where: { name: 'Karachi Fixtures Ltd.' } }))!;
  const shanghaiSupplier = (await prisma.supplier.findUnique({ where: { name: 'Shanghai Bathroom Supplies' } }))!;
  const delhiSupplier = (await prisma.supplier.findUnique({ where: { name: 'Delhi Premium Fittings' } }))!;

  const purchaseOrders = [
    {
      poNumber: 'PO-2025-001', supplierId: beijingSupplier.id, orderDate: daysAgo(30), expectedArrivalDate: daysAgo(5),
      status: 'PENDING' as const, totalAmount: new Decimal('3100.00'), containerNo: 'CSLU1234567',
      notes: 'Sinks order from Beijing — awaiting arrival',
      items: [
        { productId: p.SINK001.id, quantity: 10, unitCost: new Decimal('150.00'), totalCost: new Decimal('1500.00') },
        { productId: p.SINK002.id, quantity: 8, unitCost: new Decimal('200.00'), totalCost: new Decimal('1600.00') },
      ],
    },
    {
      poNumber: 'PO-2025-002', supplierId: karachiSupplier.id, orderDate: daysAgo(20), expectedArrivalDate: daysAgo(3),
      status: 'IN_TRANSIT' as const, totalAmount: new Decimal('2625.00'), containerNo: null,
      notes: 'Faucets from Karachi — in transit',
      items: [
        { productId: p.FAUCET001.id, quantity: 20, unitCost: new Decimal('75.00'), totalCost: new Decimal('1500.00') },
        { productId: p.FAUCET002.id, quantity: 25, unitCost: new Decimal('45.00'), totalCost: new Decimal('1125.00') },
      ],
    },
    {
      poNumber: 'PO-2025-003', supplierId: shanghaiSupplier.id, orderDate: daysAgo(40), expectedArrivalDate: daysAgo(10),
      status: 'RECEIVED' as const, totalAmount: new Decimal('2640.00'), containerNo: 'MSKU9876543',
      notes: 'Toilet units — fully received and inspected',
      items: [
        { productId: p.TOILET001.id, quantity: 10, unitCost: new Decimal('120.00'), totalCost: new Decimal('1200.00') },
        { productId: p.TOILET002.id, quantity: 8, unitCost: new Decimal('180.00'), totalCost: new Decimal('1440.00') },
      ],
    },
    {
      poNumber: 'PO-2025-004', supplierId: delhiSupplier.id, orderDate: daysAgo(15), expectedArrivalDate: daysFromNow(10),
      status: 'PENDING' as const, totalAmount: new Decimal('4100.00'), containerNo: null,
      notes: 'Mixed shower and accessories order',
      items: [
        { productId: p.SHOWER001.id, quantity: 15, unitCost: new Decimal('90.00'), totalCost: new Decimal('1350.00') },
        { productId: p.SHOWER002.id, quantity: 5, unitCost: new Decimal('250.00'), totalCost: new Decimal('1250.00') },
        { productId: p.ACC001.id, quantity: 30, unitCost: new Decimal('25.00'), totalCost: new Decimal('750.00') },
        { productId: p.ACC002.id, quantity: 50, unitCost: new Decimal('15.00'), totalCost: new Decimal('750.00') },
      ],
    },
    {
      poNumber: 'PO-2025-005', supplierId: beijingSupplier.id, orderDate: daysAgo(25),
      expectedArrivalDate: null, status: 'CANCELLED' as const, totalAmount: new Decimal('0.00'), containerNo: null,
      notes: 'Cancelled — supplier could not meet quality requirements',
      items: [
        { productId: p.FAUCET001.id, quantity: 5, unitCost: new Decimal('75.00'), totalCost: new Decimal('375.00') },
      ],
    },
  ];

  for (const po of purchaseOrders) {
    const { items, ...poData } = po;
    await prisma.purchaseOrder.upsert({
      where: { poNumber: poData.poNumber },
      update: {},
      create: { ...poData, items: { create: items } },
    });
  }
  console.log('  ✓ 5 purchase orders created (PENDING, IN_TRANSIT, RECEIVED, PENDING, CANCELLED)');

  // ============ Invoices + Journal Entries ============
  console.log('\n🧾 Creating invoices with journal entries...');

  let invoiceSeq = 0;
  const nextInvNum = () => `INV-${today.getFullYear()}-${String(++invoiceSeq).padStart(3, '0')}`;

  interface InvoiceSeed {
    invoiceNumber: string;
    clientId: string;
    warehouseId: string;
    invoiceDate: Date;
    dueDate: Date;
    paymentType: 'CREDIT' | 'CASH';
    subtotal: number;
    taxAmount: number;
    taxRate: number;
    total: number;
    paidAmount: number;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
    items: Array<{ productId: string; quantity: number; unitPrice: number; discount: number; total: number }>;
  }

  const invoices: InvoiceSeed[] = [
    // INV-001: ABC Construction — PENDING (recent, not yet due)
    {
      invoiceNumber: nextInvNum(), clientId: c1.id, warehouseId: w1.id,
      invoiceDate: daysAgo(5), dueDate: daysFromNow(25), paymentType: 'CREDIT',
      subtotal: 4250, taxAmount: 0, taxRate: 0, total: 4250, paidAmount: 0, status: 'PENDING',
      items: [
        { productId: p.SINK001.id, quantity: 5, unitPrice: 250, discount: 0, total: 1250 },
        { productId: p.FAUCET001.id, quantity: 10, unitPrice: 125, discount: 0, total: 1250 },
        { productId: p.ACC001.id, quantity: 10, unitPrice: 55, discount: 0, total: 550 },
        { productId: p.SHOWER001.id, quantity: 5, unitPrice: 160, discount: 0, total: 800 },
        { productId: p.ACC002.id, quantity: 10, unitPrice: 35, discount: 5, total: 400 },
      ],
    },
    // INV-002: Paradise Builders — PAID (cash sale)
    {
      invoiceNumber: nextInvNum(), clientId: c2.id, warehouseId: w1.id,
      invoiceDate: daysAgo(10), dueDate: daysAgo(10), paymentType: 'CASH',
      subtotal: 5650, taxAmount: 0, taxRate: 0, total: 5650, paidAmount: 5650, status: 'PAID',
      items: [
        { productId: p.TOILET002.id, quantity: 10, unitPrice: 320, discount: 0, total: 3200 },
        { productId: p.FAUCET002.id, quantity: 10, unitPrice: 85, discount: 0, total: 850 },
        { productId: p.SHOWER001.id, quantity: 10, unitPrice: 160, discount: 0, total: 1600 },
      ],
    },
    // INV-003: Metro Plumbing — PARTIAL (big order, partially paid)
    {
      invoiceNumber: nextInvNum(), clientId: c3.id, warehouseId: w2.id,
      invoiceDate: daysAgo(20), dueDate: daysAgo(5), paymentType: 'CREDIT',
      subtotal: 9750, taxAmount: 0, taxRate: 0, total: 9750, paidAmount: 4000, status: 'PARTIAL',
      items: [
        { productId: p.SINK001.id, quantity: 15, unitPrice: 250, discount: 0, total: 3750 },
        { productId: p.SINK002.id, quantity: 8, unitPrice: 350, discount: 0, total: 2800 },
        { productId: p.FAUCET001.id, quantity: 12, unitPrice: 125, discount: 0, total: 1500 },
        { productId: p.SHOWER002.id, quantity: 2, unitPrice: 450, discount: 5, total: 850 },
        { productId: p.ACC002.id, quantity: 20, unitPrice: 35, discount: 3, total: 850 },
      ],
    },
    // INV-004: Royal Interiors — PAID
    {
      invoiceNumber: nextInvNum(), clientId: c4.id, warehouseId: w1.id,
      invoiceDate: daysAgo(15), dueDate: daysFromNow(15), paymentType: 'CASH',
      subtotal: 3800, taxAmount: 0, taxRate: 0, total: 3800, paidAmount: 3800, status: 'PAID',
      items: [
        { productId: p.TOILET001.id, quantity: 8, unitPrice: 200, discount: 0, total: 1600 },
        { productId: p.FAUCET001.id, quantity: 8, unitPrice: 125, discount: 0, total: 1000 },
        { productId: p.ACC001.id, quantity: 15, unitPrice: 55, discount: 0, total: 825 },
        { productId: p.ACC002.id, quantity: 10, unitPrice: 35, discount: 3, total: 375 },
      ],
    },
    // INV-005: Green Valley — OVERDUE
    {
      invoiceNumber: nextInvNum(), clientId: c5.id, warehouseId: w2.id,
      invoiceDate: daysAgo(35), dueDate: daysAgo(15), paymentType: 'CREDIT',
      subtotal: 12200, taxAmount: 0, taxRate: 0, total: 12200, paidAmount: 0, status: 'OVERDUE',
      items: [
        { productId: p.TOILET002.id, quantity: 20, unitPrice: 320, discount: 0, total: 6400 },
        { productId: p.SINK001.id, quantity: 8, unitPrice: 250, discount: 0, total: 2000 },
        { productId: p.SHOWER002.id, quantity: 4, unitPrice: 450, discount: 0, total: 1800 },
        { productId: p.FAUCET002.id, quantity: 20, unitPrice: 85, discount: 5, total: 2000 },
      ],
    },
    // INV-006: ABC Construction — PAID
    {
      invoiceNumber: nextInvNum(), clientId: c1.id, warehouseId: w1.id,
      invoiceDate: daysAgo(12), dueDate: daysFromNow(18), paymentType: 'CASH',
      subtotal: 4750, taxAmount: 0, taxRate: 0, total: 4750, paidAmount: 4750, status: 'PAID',
      items: [
        { productId: p.SINK002.id, quantity: 6, unitPrice: 350, discount: 0, total: 2100 },
        { productId: p.FAUCET002.id, quantity: 15, unitPrice: 85, discount: 0, total: 1275 },
        { productId: p.SHOWER001.id, quantity: 5, unitPrice: 160, discount: 0, total: 800 },
        { productId: p.ACC001.id, quantity: 10, unitPrice: 55, discount: 5, total: 575 },
      ],
    },
    // INV-007: Paradise Builders — PARTIAL
    {
      invoiceNumber: nextInvNum(), clientId: c2.id, warehouseId: w1.id,
      invoiceDate: daysAgo(8), dueDate: daysFromNow(37), paymentType: 'CREDIT',
      subtotal: 15200, taxAmount: 0, taxRate: 0, total: 15200, paidAmount: 5000, status: 'PARTIAL',
      items: [
        { productId: p.TOILET002.id, quantity: 25, unitPrice: 320, discount: 0, total: 8000 },
        { productId: p.SINK001.id, quantity: 12, unitPrice: 250, discount: 0, total: 3000 },
        { productId: p.SHOWER002.id, quantity: 5, unitPrice: 450, discount: 0, total: 2250 },
        { productId: p.FAUCET002.id, quantity: 20, unitPrice: 85, discount: 3, total: 1950 },
      ],
    },
    // INV-008: Metro Plumbing — PAID
    {
      invoiceNumber: nextInvNum(), clientId: c3.id, warehouseId: w2.id,
      invoiceDate: daysAgo(6), dueDate: daysFromNow(9), paymentType: 'CASH',
      subtotal: 6300, taxAmount: 0, taxRate: 0, total: 6300, paidAmount: 6300, status: 'PAID',
      items: [
        { productId: p.SINK002.id, quantity: 10, unitPrice: 350, discount: 0, total: 3500 },
        { productId: p.FAUCET001.id, quantity: 12, unitPrice: 125, discount: 0, total: 1500 },
        { productId: p.ACC001.id, quantity: 20, unitPrice: 55, discount: 5, total: 1300 },
      ],
    },
    // INV-009: Royal Interiors — PENDING (large order, recent)
    {
      invoiceNumber: nextInvNum(), clientId: c4.id, warehouseId: w1.id,
      invoiceDate: daysAgo(3), dueDate: daysFromNow(27), paymentType: 'CREDIT',
      subtotal: 18500, taxAmount: 0, taxRate: 0, total: 18500, paidAmount: 0, status: 'PENDING',
      items: [
        { productId: p.SINK001.id, quantity: 20, unitPrice: 250, discount: 0, total: 5000 },
        { productId: p.TOILET002.id, quantity: 15, unitPrice: 320, discount: 0, total: 4800 },
        { productId: p.SHOWER002.id, quantity: 8, unitPrice: 450, discount: 0, total: 3600 },
        { productId: p.FAUCET001.id, quantity: 15, unitPrice: 125, discount: 0, total: 1875 },
        { productId: p.SINK002.id, quantity: 5, unitPrice: 350, discount: 0, total: 1750 },
        { productId: p.ACC001.id, quantity: 20, unitPrice: 55, discount: 5, total: 1475 },
      ],
    },
    // INV-010: City Mart — PAID (small cash order)
    {
      invoiceNumber: nextInvNum(), clientId: c6.id, warehouseId: w1.id,
      invoiceDate: daysAgo(2), dueDate: daysAgo(2), paymentType: 'CASH',
      subtotal: 2450, taxAmount: 0, taxRate: 0, total: 2450, paidAmount: 2450, status: 'PAID',
      items: [
        { productId: p.FAUCET002.id, quantity: 10, unitPrice: 85, discount: 0, total: 850 },
        { productId: p.ACC001.id, quantity: 10, unitPrice: 55, discount: 0, total: 550 },
        { productId: p.ACC002.id, quantity: 20, unitPrice: 35, discount: 0, total: 700 },
        { productId: p.SHOWER001.id, quantity: 2, unitPrice: 160, discount: 5, total: 350 },
      ],
    },
    // INV-011: Green Valley — OVERDUE (older)
    {
      invoiceNumber: nextInvNum(), clientId: c5.id, warehouseId: w2.id,
      invoiceDate: daysAgo(50), dueDate: daysAgo(30), paymentType: 'CREDIT',
      subtotal: 7500, taxAmount: 0, taxRate: 0, total: 7500, paidAmount: 0, status: 'OVERDUE',
      items: [
        { productId: p.SINK001.id, quantity: 10, unitPrice: 250, discount: 0, total: 2500 },
        { productId: p.FAUCET001.id, quantity: 20, unitPrice: 125, discount: 0, total: 2500 },
        { productId: p.TOILET001.id, quantity: 5, unitPrice: 200, discount: 0, total: 1000 },
        { productId: p.SHOWER001.id, quantity: 5, unitPrice: 160, discount: 5, total: 1500 },
      ],
    },
    // INV-012: Paradise Builders — PENDING (today)
    {
      invoiceNumber: nextInvNum(), clientId: c2.id, warehouseId: w2.id,
      invoiceDate: today, dueDate: daysFromNow(45), paymentType: 'CREDIT',
      subtotal: 8800, taxAmount: 0, taxRate: 0, total: 8800, paidAmount: 0, status: 'PENDING',
      items: [
        { productId: p.SINK001.id, quantity: 10, unitPrice: 250, discount: 0, total: 2500 },
        { productId: p.TOILET002.id, quantity: 8, unitPrice: 320, discount: 0, total: 2560 },
        { productId: p.SHOWER002.id, quantity: 3, unitPrice: 450, discount: 0, total: 1350 },
        { productId: p.FAUCET001.id, quantity: 8, unitPrice: 125, discount: 0, total: 1000 },
        { productId: p.ACC001.id, quantity: 20, unitPrice: 55, discount: 5, total: 1390 },
      ],
    },
    // INV-013: ABC Construction — PARTIAL (today)
    {
      invoiceNumber: nextInvNum(), clientId: c1.id, warehouseId: w1.id,
      invoiceDate: today, dueDate: daysFromNow(30), paymentType: 'CREDIT',
      subtotal: 6200, taxAmount: 0, taxRate: 0, total: 6200, paidAmount: 2000, status: 'PARTIAL',
      items: [
        { productId: p.SINK001.id, quantity: 8, unitPrice: 250, discount: 0, total: 2000 },
        { productId: p.TOILET001.id, quantity: 5, unitPrice: 200, discount: 0, total: 1000 },
        { productId: p.SHOWER001.id, quantity: 8, unitPrice: 160, discount: 0, total: 1280 },
        { productId: p.FAUCET002.id, quantity: 15, unitPrice: 85, discount: 0, total: 1275 },
        { productId: p.ACC002.id, quantity: 15, unitPrice: 35, discount: 3, total: 645 },
      ],
    },
    // INV-014: Royal Interiors — PAID (today)
    {
      invoiceNumber: nextInvNum(), clientId: c4.id, warehouseId: w1.id,
      invoiceDate: today, dueDate: today, paymentType: 'CASH',
      subtotal: 3150, taxAmount: 0, taxRate: 0, total: 3150, paidAmount: 3150, status: 'PAID',
      items: [
        { productId: p.TOILET002.id, quantity: 5, unitPrice: 320, discount: 0, total: 1600 },
        { productId: p.FAUCET001.id, quantity: 5, unitPrice: 125, discount: 0, total: 625 },
        { productId: p.ACC001.id, quantity: 10, unitPrice: 55, discount: 0, total: 550 },
        { productId: p.ACC002.id, quantity: 10, unitPrice: 35, discount: 3, total: 375 },
      ],
    },
    // INV-015: Metro Plumbing — PENDING (today)
    {
      invoiceNumber: nextInvNum(), clientId: c3.id, warehouseId: w2.id,
      invoiceDate: today, dueDate: daysFromNow(15), paymentType: 'CREDIT',
      subtotal: 4500, taxAmount: 0, taxRate: 0, total: 4500, paidAmount: 0, status: 'PENDING',
      items: [
        { productId: p.SHOWER002.id, quantity: 4, unitPrice: 450, discount: 0, total: 1800 },
        { productId: p.SINK002.id, quantity: 4, unitPrice: 350, discount: 0, total: 1400 },
        { productId: p.FAUCET002.id, quantity: 10, unitPrice: 85, discount: 0, total: 850 },
        { productId: p.ACC002.id, quantity: 12, unitPrice: 35, discount: 3, total: 450 },
      ],
    },
  ];

  // Create invoices within a transaction so journal entries and balances are consistent
  await prisma.$transaction(async (tx) => {
    for (const inv of invoices) {
      const existing = await tx.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
      if (existing) continue;

      const created = await tx.invoice.create({
        data: {
          invoiceNumber: inv.invoiceNumber,
          clientId: inv.clientId,
          warehouseId: inv.warehouseId,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          paymentType: inv.paymentType,
          subtotal: new Decimal(inv.subtotal),
          taxAmount: new Decimal(inv.taxAmount),
          taxRate: new Decimal(inv.taxRate),
          total: new Decimal(inv.total),
          paidAmount: new Decimal(inv.paidAmount),
          status: inv.status,
          items: {
            create: inv.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: new Decimal(it.unitPrice),
              discount: new Decimal(it.discount),
              total: new Decimal(it.total),
            })),
          },
        },
      });

      // Create journal entry: DR A/R (1200) / CR Sales Revenue (4100)
      await createJournalEntry(tx, {
        date: inv.invoiceDate,
        description: `Invoice ${inv.invoiceNumber}`,
        referenceType: 'INVOICE',
        referenceId: created.id,
        userId: adminUser.id,
        lines: [
          { accountCode: '1200', debit: inv.total, credit: 0, description: `A/R for ${inv.invoiceNumber}` },
          { accountCode: '4100', debit: 0, credit: inv.subtotal, description: `Sales revenue ${inv.invoiceNumber}` },
          ...(inv.taxAmount > 0 ? [{ accountCode: '2200', debit: 0, credit: inv.taxAmount, description: `Tax ${inv.invoiceNumber}` }] : []),
        ],
      });

      // Update client balance for CREDIT invoices
      if (inv.paymentType === 'CREDIT') {
        const outstanding = inv.total - inv.paidAmount;
        await tx.client.update({
          where: { id: inv.clientId },
          data: { balance: { increment: outstanding } },
        });
      }
    }
  });
  console.log(`  ✓ ${invoices.length} invoices created with journal entries`);

  // ============ Client Payments ============
  console.log('\n💰 Creating client payments with allocations...');

  // Get account IDs for bank
  const bankAccount = await prisma.accountHead.findFirst({ where: { code: '1101' } });

  // Payments for partial/paid invoices
  const paymentInvoices = await prisma.invoice.findMany({
    where: {
      invoiceNumber: { in: invoices.filter((i) => i.paidAmount > 0).map((i) => i.invoiceNumber) },
    },
  });

  let paymentCount = 0;
  await prisma.$transaction(async (tx) => {
    for (const inv of invoices.filter((i) => i.paidAmount > 0)) {
      const invoiceRecord = paymentInvoices.find((pi) => pi.invoiceNumber === inv.invoiceNumber);
      if (!invoiceRecord) continue;

      // Check if payment already exists
      const existingPayment = await tx.payment.findFirst({
        where: { clientId: inv.clientId, paymentType: 'CLIENT', amount: new Decimal(inv.paidAmount) },
      });
      if (existingPayment) continue;

      const payment = await tx.payment.create({
        data: {
          clientId: inv.clientId,
          paymentType: 'CLIENT',
          amount: new Decimal(inv.paidAmount),
          method: inv.paymentType === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
          date: inv.invoiceDate,
          referenceNumber: inv.paymentType === 'CASH' ? null : `CHQ-${String(paymentCount + 1).padStart(4, '0')}`,
          notes: `Payment for ${inv.invoiceNumber}`,
          recordedBy: adminUser.id,
          bankAccountId: bankAccount?.id,
          allocations: {
            create: [{
              invoiceId: invoiceRecord.id,
              amount: new Decimal(inv.paidAmount),
            }],
          },
        },
      });

      // JE: DR Bank (1101) / CR A/R (1200)
      await createJournalEntry(tx, {
        date: inv.invoiceDate,
        description: `Client payment — ${inv.invoiceNumber}`,
        referenceType: 'PAYMENT',
        referenceId: payment.id,
        userId: adminUser.id,
        lines: [
          { accountCode: '1101', debit: inv.paidAmount, credit: 0, description: 'Bank deposit' },
          { accountCode: '1200', debit: 0, credit: inv.paidAmount, description: 'A/R reduction' },
        ],
      });

      paymentCount++;
    }
  });
  console.log(`  ✓ ${paymentCount} client payments created with allocations`);

  // ============ Supplier Payments ============
  console.log('\n💸 Creating supplier payments...');
  await prisma.$transaction(async (tx) => {
    // Payment for PO-2025-003 (RECEIVED)
    const po3 = await tx.purchaseOrder.findUnique({ where: { poNumber: 'PO-2025-003' } });
    if (po3) {
      const existingSP = await tx.payment.findFirst({
        where: { supplierId: shanghaiSupplier.id, paymentType: 'SUPPLIER', amount: new Decimal('2640.00') },
      });
      if (!existingSP) {
        const sp = await tx.payment.create({
          data: {
            supplierId: shanghaiSupplier.id,
            paymentType: 'SUPPLIER',
            paymentReferenceType: 'PO',
            referenceId: po3.id,
            amount: new Decimal('2640.00'),
            method: 'BANK_TRANSFER',
            date: daysAgo(8),
            referenceNumber: 'TT-20250205',
            notes: 'Payment for PO-2025-003 (toilet units)',
            recordedBy: adminUser.id,
            bankAccountId: bankAccount?.id,
          },
        });

        // JE: DR A/P (2100) / CR Bank (1101)
        await createJournalEntry(tx, {
          date: daysAgo(8),
          description: 'Supplier payment — PO-2025-003',
          referenceType: 'PAYMENT',
          referenceId: sp.id,
          userId: adminUser.id,
          lines: [
            { accountCode: '2100', debit: 2640, credit: 0, description: 'A/P reduction' },
            { accountCode: '1101', debit: 0, credit: 2640, description: 'Bank payment' },
          ],
        });
      }
    }

    // Partial payment for PO-2025-001
    const po1 = await tx.purchaseOrder.findUnique({ where: { poNumber: 'PO-2025-001' } });
    if (po1) {
      const existingSP = await tx.payment.findFirst({
        where: { supplierId: beijingSupplier.id, paymentType: 'SUPPLIER', amount: new Decimal('1500.00') },
      });
      if (!existingSP) {
        const sp = await tx.payment.create({
          data: {
            supplierId: beijingSupplier.id,
            paymentType: 'SUPPLIER',
            paymentReferenceType: 'PO',
            referenceId: po1.id,
            amount: new Decimal('1500.00'),
            method: 'BANK_TRANSFER',
            date: daysAgo(25),
            referenceNumber: 'TT-20250115',
            notes: 'Advance payment for PO-2025-001 (50%)',
            recordedBy: adminUser.id,
            bankAccountId: bankAccount?.id,
          },
        });

        await createJournalEntry(tx, {
          date: daysAgo(25),
          description: 'Supplier advance — PO-2025-001',
          referenceType: 'PAYMENT',
          referenceId: sp.id,
          userId: adminUser.id,
          lines: [
            { accountCode: '2100', debit: 1500, credit: 0, description: 'A/P reduction' },
            { accountCode: '1101', debit: 0, credit: 1500, description: 'Bank payment' },
          ],
        });
      }
    }
  });
  console.log('  ✓ 2 supplier payments created');

  // ============ Goods Received Journal Entry (for PO-2025-003) ============
  console.log('\n📥 Creating goods received journal entry...');
  await prisma.$transaction(async (tx) => {
    const po3 = await tx.purchaseOrder.findUnique({ where: { poNumber: 'PO-2025-003' } });
    if (po3) {
      // JE: DR Inventory (1300) / CR A/P (2100)
      await createJournalEntry(tx, {
        date: daysAgo(10),
        description: 'Goods received: PO-2025-003',
        referenceType: 'PO',
        referenceId: po3.id,
        userId: adminUser.id,
        lines: [
          { accountCode: '1300', debit: 2640, credit: 0, description: 'Inventory from PO-2025-003' },
          { accountCode: '2100', debit: 0, credit: 2640, description: 'A/P for PO-2025-003' },
        ],
      });
    }
  });
  console.log('  ✓ Goods received JE created');

  // ============ Expenses ============
  console.log('\n💳 Creating expenses...');
  const expensesData = [
    { category: 'RENT' as const, amount: new Decimal('150000'), description: 'Monthly warehouse rent — Karachi', date: daysAgo(30), paymentMethod: 'BANK_TRANSFER' as const },
    { category: 'RENT' as const, amount: new Decimal('80000'), description: 'Monthly warehouse rent — Islamabad', date: daysAgo(30), paymentMethod: 'BANK_TRANSFER' as const },
    { category: 'UTILITIES' as const, amount: new Decimal('35000'), description: 'Electricity bill — Main warehouse', date: daysAgo(20), paymentMethod: 'BANK_TRANSFER' as const },
    { category: 'UTILITIES' as const, amount: new Decimal('18000'), description: 'Water & gas — both warehouses', date: daysAgo(18), paymentMethod: 'CASH' as const },
    { category: 'SALARIES' as const, amount: new Decimal('450000'), description: 'Monthly staff salaries — January', date: daysAgo(14), paymentMethod: 'BANK_TRANSFER' as const },
    { category: 'TRANSPORT' as const, amount: new Decimal('25000'), description: 'Delivery truck fuel & maintenance', date: daysAgo(10), paymentMethod: 'CASH' as const },
    { category: 'TRANSPORT' as const, amount: new Decimal('12000'), description: 'Inter-city shipment Karachi→Islamabad', date: daysAgo(7), paymentMethod: 'CASH' as const },
    { category: 'SUPPLIES' as const, amount: new Decimal('8500'), description: 'Office supplies and stationery', date: daysAgo(5), paymentMethod: 'CASH' as const },
    { category: 'MAINTENANCE' as const, amount: new Decimal('22000'), description: 'Forklift repair and warehouse maintenance', date: daysAgo(3), paymentMethod: 'BANK_TRANSFER' as const },
    { category: 'MISC' as const, amount: new Decimal('5000'), description: 'Miscellaneous — tea and refreshments', date: today, paymentMethod: 'CASH' as const },
  ];

  const EXPENSE_ACCOUNT_MAP: Record<string, string> = {
    RENT: '5200', UTILITIES: '5300', SALARIES: '5400', TRANSPORT: '5500',
    SUPPLIES: '5900', MAINTENANCE: '5900', MARKETING: '5900', MISC: '5900',
  };

  await prisma.$transaction(async (tx) => {
    for (const exp of expensesData) {
      const existing = await tx.expense.findFirst({
        where: { description: exp.description, date: exp.date },
      });
      if (existing) continue;

      const expense = await tx.expense.create({
        data: { ...exp, recordedBy: accountantUser.id },
      });

      const expenseCode = EXPENSE_ACCOUNT_MAP[exp.category] || '5900';
      const creditCode = exp.paymentMethod === 'CASH' ? '1102' : '1101';

      await createJournalEntry(tx, {
        date: exp.date,
        description: `Expense: ${exp.description}`,
        referenceType: 'EXPENSE',
        referenceId: expense.id,
        userId: accountantUser.id,
        lines: [
          { accountCode: expenseCode, debit: Number(exp.amount), credit: 0, description: exp.category },
          { accountCode: creditCode, debit: 0, credit: Number(exp.amount), description: exp.paymentMethod === 'CASH' ? 'Petty cash' : 'Bank payment' },
        ],
      });
    }
  });
  console.log(`  ✓ ${expensesData.length} expenses created with journal entries`);

  // ============ Gate Passes ============
  console.log('\n🚪 Creating gate passes...');
  const gatePassesData = [
    {
      gatePassNumber: 'GP-2025-001', warehouseId: w1.id, date: daysAgo(10), purpose: 'SALE' as const,
      status: 'COMPLETED' as const, issuedBy: warehouseUser.id, approvedBy: adminUser.id,
      notes: 'Delivery to Paradise Builders — DHA',
      items: [
        { productId: p.TOILET002.id, quantity: 10, batchNo: 'SH-2025-002', binLocation: 'C-01-001' },
        { productId: p.FAUCET002.id, quantity: 10, batchNo: 'KF-2025-002', binLocation: 'B-01-002' },
      ],
    },
    {
      gatePassNumber: 'GP-2025-002', warehouseId: w1.id, date: daysAgo(5), purpose: 'SALE' as const,
      status: 'COMPLETED' as const, issuedBy: warehouseUser.id, approvedBy: adminUser.id,
      notes: 'Delivery to ABC Construction — Gulberg',
      items: [
        { productId: p.SINK001.id, quantity: 5, batchNo: 'BJ-2025-001', binLocation: 'A-01-001' },
        { productId: p.FAUCET001.id, quantity: 10, batchNo: 'KF-2025-001', binLocation: 'B-01-001' },
        { productId: p.ACC001.id, quantity: 10, batchNo: 'PA-2025-001', binLocation: 'E-01-001' },
      ],
    },
    {
      gatePassNumber: 'GP-2025-003', warehouseId: w1.id, date: daysAgo(2), purpose: 'TRANSFER' as const,
      status: 'IN_TRANSIT' as const, issuedBy: warehouseUser.id, approvedBy: adminUser.id,
      referenceType: 'TRANSFER' as const,
      notes: 'Stock transfer to Islamabad branch',
      items: [
        { productId: p.SINK001.id, quantity: 5, batchNo: 'BJ-2025-001', binLocation: 'A-01-001' },
        { productId: p.SHOWER001.id, quantity: 5, batchNo: 'DS-2025-001', binLocation: 'D-01-001' },
      ],
    },
    {
      gatePassNumber: 'GP-2025-004', warehouseId: w1.id, date: today, purpose: 'SALE' as const,
      status: 'PENDING' as const, issuedBy: warehouseUser.id,
      notes: 'Pending approval — Royal Interiors order',
      items: [
        { productId: p.TOILET002.id, quantity: 5, batchNo: 'SH-2025-002', binLocation: 'C-01-001' },
        { productId: p.FAUCET001.id, quantity: 5, batchNo: 'KF-2025-001', binLocation: 'B-01-001' },
      ],
    },
    {
      gatePassNumber: 'GP-2025-005', warehouseId: w2.id, date: daysAgo(6), purpose: 'SALE' as const,
      status: 'COMPLETED' as const, issuedBy: warehouseUser.id, approvedBy: adminUser.id,
      notes: 'Delivery to Metro Plumbing — Islamabad',
      items: [
        { productId: p.SINK002.id, quantity: 10, batchNo: 'LB-2025-001', binLocation: 'A-01-001' },
        { productId: p.FAUCET001.id, quantity: 12, batchNo: 'KF-2025-001', binLocation: 'B-01-001' },
      ],
    },
  ];

  for (const gp of gatePassesData) {
    const existing = await prisma.gatePass.findUnique({ where: { gatePassNumber: gp.gatePassNumber } });
    if (existing) continue;

    const { items, ...gpData } = gp;
    await prisma.gatePass.create({
      data: {
        ...gpData,
        items: { create: items.map((it) => ({ productId: it.productId, quantity: it.quantity, batchNo: it.batchNo, binLocation: it.binLocation })) },
      },
    });
  }
  console.log('  ✓ 5 gate passes created');

  // ============ Stock Transfer ============
  console.log('\n🔄 Creating stock transfer...');
  const existingTransfer = await prisma.stockTransfer.findUnique({ where: { transferNumber: 'STR-2025-001' } });
  if (!existingTransfer) {
    await prisma.stockTransfer.create({
      data: {
        transferNumber: 'STR-2025-001',
        sourceWarehouseId: w1.id,
        destinationWarehouseId: w2.id,
        status: 'IN_TRANSIT',
        requestedBy: warehouseUser.id,
        approvedBy: adminUser.id,
        notes: 'Restocking Islamabad branch — sinks and showers',
        items: {
          create: [
            { productId: p.SINK001.id, batchNo: 'BJ-2025-001', quantity: 5 },
            { productId: p.SHOWER001.id, batchNo: 'DS-2025-001', quantity: 5 },
          ],
        },
      },
    });
  }

  const existingTransfer2 = await prisma.stockTransfer.findUnique({ where: { transferNumber: 'STR-2025-002' } });
  if (!existingTransfer2) {
    await prisma.stockTransfer.create({
      data: {
        transferNumber: 'STR-2025-002',
        sourceWarehouseId: w1.id,
        destinationWarehouseId: w2.id,
        status: 'COMPLETED',
        requestedBy: warehouseUser.id,
        approvedBy: adminUser.id,
        completedBy: warehouseUser.id,
        notes: 'Completed transfer — accessories',
        items: {
          create: [
            { productId: p.ACC001.id, batchNo: 'PA-2025-001', quantity: 20, receivedQuantity: 20 },
            { productId: p.ACC002.id, batchNo: 'PA-2025-002', quantity: 30, receivedQuantity: 30 },
          ],
        },
      },
    });
  }
  console.log('  ✓ 2 stock transfers created (1 in-transit, 1 completed)');

  // ============ Stock Count ============
  console.log('\n📝 Creating stock count...');
  const existingCount = await prisma.stockCount.findUnique({ where: { countNumber: 'SC-2025-001' } });
  if (!existingCount) {
    await prisma.stockCount.create({
      data: {
        countNumber: 'SC-2025-001',
        warehouseId: w1.id,
        status: 'COMPLETED',
        countDate: daysAgo(7),
        notes: 'Monthly inventory count — Karachi warehouse',
        createdBy: warehouseUser.id,
        completedBy: warehouseUser.id,
        items: {
          create: [
            { productId: p.SINK001.id, batchNo: 'BJ-2025-001', binLocation: 'A-01-001', systemQuantity: 50, countedQuantity: 50, variance: 0 },
            { productId: p.SINK002.id, batchNo: 'LB-2025-001', binLocation: 'A-01-002', systemQuantity: 30, countedQuantity: 29, variance: -1, notes: '1 unit damaged' },
            { productId: p.FAUCET001.id, batchNo: 'KF-2025-001', binLocation: 'B-01-001', systemQuantity: 80, countedQuantity: 80, variance: 0 },
            { productId: p.FAUCET002.id, batchNo: 'KF-2025-002', binLocation: 'B-01-002', systemQuantity: 100, countedQuantity: 100, variance: 0 },
            { productId: p.TOILET001.id, batchNo: 'SH-2025-001', binLocation: 'C-01-001', systemQuantity: 25, countedQuantity: 25, variance: 0 },
            { productId: p.TOILET002.id, batchNo: 'SH-2025-002', binLocation: 'C-01-001', systemQuantity: 20, countedQuantity: 20, variance: 0 },
          ],
        },
      },
    });
  }

  const existingCount2 = await prisma.stockCount.findUnique({ where: { countNumber: 'SC-2025-002' } });
  if (!existingCount2) {
    await prisma.stockCount.create({
      data: {
        countNumber: 'SC-2025-002',
        warehouseId: w2.id,
        status: 'IN_PROGRESS',
        countDate: today,
        notes: 'Monthly inventory count — Islamabad branch (in progress)',
        createdBy: warehouseUser.id,
        items: {
          create: [
            { productId: p.SINK001.id, batchNo: 'BJ-2025-001', binLocation: 'A-01-001', systemQuantity: 15, countedQuantity: 15, variance: 0 },
            { productId: p.SINK002.id, batchNo: 'LB-2025-001', binLocation: 'A-01-001', systemQuantity: 10, countedQuantity: null, variance: null },
            { productId: p.FAUCET001.id, batchNo: 'KF-2025-001', binLocation: 'B-01-001', systemQuantity: 30, countedQuantity: null, variance: null },
          ],
        },
      },
    });
  }
  console.log('  ✓ 2 stock counts created (1 completed, 1 in-progress)');

  // ============ Recovery Visits ============
  console.log('\n🚗 Creating recovery visits...');
  let visitSeq = 0;
  const nextVisitNum = () => `RV-${today.getFullYear()}-${String(++visitSeq).padStart(3, '0')}`;

  const visitsData = [
    // Visit to Green Valley — overdue, got a promise
    {
      visitNumber: nextVisitNum(), clientId: c5.id, visitDate: daysAgo(10), visitTime: '10:00',
      outcome: 'PROMISE_MADE' as const, amountCollected: new Decimal('0'),
      promiseDate: daysAgo(3), promiseAmount: new Decimal('7500'),
      notes: 'Client promised to pay Rs 7,500 within a week. Business slow due to market conditions.',
      visitedBy: recoveryUser.id,
    },
    // Visit to ABC Construction — partial payment collected
    {
      visitNumber: nextVisitNum(), clientId: c1.id, visitDate: daysAgo(7), visitTime: '11:30',
      outcome: 'PARTIAL_PAYMENT' as const, amountCollected: new Decimal('2000'),
      notes: 'Collected Rs 2,000 cash. Client said remaining will be paid next week.',
      visitedBy: recoveryUser.id,
    },
    // Visit to Paradise Builders — full payment collected
    {
      visitNumber: nextVisitNum(), clientId: c2.id, visitDate: daysAgo(5), visitTime: '14:00',
      outcome: 'PAYMENT_COLLECTED' as const, amountCollected: new Decimal('5000'),
      notes: 'Collected Rs 5,000 via cheque (CHQ-0005). Client cooperative.',
      visitedBy: recoveryUser.id,
    },
    // Visit to Metro Plumbing — client unavailable
    {
      visitNumber: nextVisitNum(), clientId: c3.id, visitDate: daysAgo(3), visitTime: '09:00',
      outcome: 'CLIENT_UNAVAILABLE' as const, amountCollected: new Decimal('0'),
      notes: 'Office closed. Left message with receptionist. Will follow up tomorrow.',
      visitedBy: recoveryUser.id,
    },
    // Visit to Green Valley — promise broken, refused to pay
    {
      visitNumber: nextVisitNum(), clientId: c5.id, visitDate: daysAgo(2), visitTime: '15:00',
      outcome: 'REFUSED_TO_PAY' as const, amountCollected: new Decimal('0'),
      notes: 'Client did not honor promise. Says cannot pay until next month. Escalating to management.',
      visitedBy: recoveryUser.id,
    },
    // Visit to Royal Interiors — promise made
    {
      visitNumber: nextVisitNum(), clientId: c4.id, visitDate: daysAgo(1), visitTime: '16:00',
      outcome: 'PROMISE_MADE' as const, amountCollected: new Decimal('0'),
      promiseDate: daysFromNow(5), promiseAmount: new Decimal('18500'),
      notes: 'Client promised full payment for INV-009 by end of next week.',
      visitedBy: recoveryUser.id,
    },
    // Visit today — dispute raised
    {
      visitNumber: nextVisitNum(), clientId: c3.id, visitDate: today, visitTime: '10:30',
      outcome: 'DISPUTE_RAISED' as const, amountCollected: new Decimal('0'),
      notes: 'Client claims 3 items from last delivery were damaged. Needs credit note before payment.',
      visitedBy: recoveryUser.id,
    },
  ];

  for (const visit of visitsData) {
    const existing = await prisma.recoveryVisit.findUnique({ where: { visitNumber: visit.visitNumber } });
    if (existing) continue;
    await prisma.recoveryVisit.create({ data: visit });
  }
  console.log(`  ✓ ${visitsData.length} recovery visits created`);

  // ============ Payment Promises ============
  console.log('\n🤝 Creating payment promises...');
  const rv1 = await prisma.recoveryVisit.findUnique({ where: { visitNumber: 'RV-' + today.getFullYear() + '-001' } });
  const rv6 = await prisma.recoveryVisit.findUnique({ where: { visitNumber: 'RV-' + today.getFullYear() + '-006' } });

  if (rv1) {
    const existing = await prisma.paymentPromise.findFirst({ where: { recoveryVisitId: rv1.id } });
    if (!existing) {
      await prisma.paymentPromise.create({
        data: {
          clientId: c5.id,
          promiseDate: daysAgo(3),
          promiseAmount: new Decimal('7500'),
          status: 'BROKEN', // They didn't pay
          recoveryVisitId: rv1.id,
          notes: 'Promise broken — client refused to pay on follow-up visit',
          createdBy: recoveryUser.id,
        },
      });
    }
  }

  if (rv6) {
    const existing = await prisma.paymentPromise.findFirst({ where: { recoveryVisitId: rv6.id } });
    if (!existing) {
      await prisma.paymentPromise.create({
        data: {
          clientId: c4.id,
          promiseDate: daysFromNow(5),
          promiseAmount: new Decimal('18500'),
          status: 'PENDING',
          recoveryVisitId: rv6.id,
          notes: 'Full payment for INV-009 promised',
          createdBy: recoveryUser.id,
        },
      });
    }
  }

  // A standalone promise (not from visit)
  const existingPromise = await prisma.paymentPromise.findFirst({
    where: { clientId: c1.id, promiseAmount: new Decimal('4250') },
  });
  if (!existingPromise) {
    await prisma.paymentPromise.create({
      data: {
        clientId: c1.id,
        promiseDate: daysFromNow(3),
        promiseAmount: new Decimal('4250'),
        status: 'PENDING',
        notes: 'Phone commitment for INV-001 payment',
        createdBy: recoveryUser.id,
      },
    });
  }
  console.log('  ✓ 3 payment promises created (1 broken, 2 pending)');

  // ============ Alerts ============
  console.log('\n🔔 Creating alerts...');
  const alertsData = [
    {
      type: 'CLIENT_OVERDUE' as const,
      priority: 'HIGH' as const,
      message: `Green Valley Homes has Rs 19,700 overdue across 2 invoices. Last visit: client refused to pay.`,
      relatedType: 'CLIENT',
      relatedId: c5.id,
      targetRole: 'ADMIN',
    },
    {
      type: 'CLIENT_OVERDUE' as const,
      priority: 'MEDIUM' as const,
      message: `Metro Plumbing Services has Rs 5,750 overdue. Dispute raised regarding damaged items.`,
      relatedType: 'CLIENT',
      relatedId: c3.id,
      targetRole: 'ADMIN',
    },
    {
      type: 'PROMISE_BROKEN' as const,
      priority: 'HIGH' as const,
      message: `Green Valley Homes broke payment promise of Rs 7,500 (due ${daysAgo(3).toLocaleDateString()}).`,
      relatedType: 'CLIENT',
      relatedId: c5.id,
      targetUserId: recoveryUser.id,
    },
    {
      type: 'CREDIT_LIMIT_EXCEEDED' as const,
      priority: 'CRITICAL' as const,
      message: `Green Valley Homes balance (Rs 19,700) exceeds credit limit (Rs 200,000) — review required.`,
      relatedType: 'CLIENT',
      relatedId: c5.id,
      targetRole: 'ADMIN',
    },
    {
      type: 'STOCK_LOW' as const,
      priority: 'MEDIUM' as const,
      message: `Shower Panel System (SHOWER-002) stock is low: 5 units in Islamabad warehouse (reorder level: 5).`,
      relatedType: 'PRODUCT',
      relatedId: p.SHOWER002.id,
      targetRole: 'WAREHOUSE_MANAGER',
    },
    {
      type: 'STOCK_LOW' as const,
      priority: 'LOW' as const,
      message: `Dual Flush Toilet (TOILET-002) stock is low: 8 units in Islamabad warehouse (reorder level: 8).`,
      relatedType: 'PRODUCT',
      relatedId: p.TOILET002.id,
      targetRole: 'WAREHOUSE_MANAGER',
    },
  ];

  for (const alert of alertsData) {
    // Simple dedup check on message
    const existing = await prisma.alert.findFirst({
      where: { message: alert.message },
    });
    if (!existing) {
      await prisma.alert.create({ data: alert });
    }
  }
  console.log(`  ✓ ${alertsData.length} alerts created`);

  // ============ Alert Rules ============
  console.log('\n📋 Creating alert rules...');
  const alertRules = [
    { name: '15 Days Overdue', daysOverdue: 15, priority: 'MEDIUM' as const, targetRoles: ['ADMIN', 'RECOVERY_AGENT'], action: 'NOTIFY' as const },
    { name: '30 Days Overdue', daysOverdue: 30, priority: 'HIGH' as const, targetRoles: ['ADMIN', 'RECOVERY_AGENT'], action: 'NOTIFY' as const },
    { name: '60 Days Overdue', daysOverdue: 60, priority: 'CRITICAL' as const, targetRoles: ['ADMIN'], action: 'NOTIFY' as const },
  ];

  for (const rule of alertRules) {
    await prisma.alertRule.upsert({
      where: { name: rule.name },
      update: {},
      create: rule,
    });
  }
  console.log('  ✓ 3 alert rules created');

  // ============ Stock Adjustment ============
  console.log('\n⚙️ Creating stock adjustment...');
  const existingAdj = await prisma.stockAdjustment.findFirst({
    where: { productId: p.SINK002.id, warehouseId: w1.id, adjustmentType: 'DAMAGE' },
  });
  if (!existingAdj) {
    await prisma.stockAdjustment.create({
      data: {
        productId: p.SINK002.id,
        warehouseId: w1.id,
        adjustmentType: 'DAMAGE',
        quantity: -1,
        reason: 'Found 1 damaged unit during stock count SC-2025-001',
        notes: 'Crack in ceramic basin — cannot be sold',
        status: 'APPROVED',
        createdBy: warehouseUser.id,
        reviewedBy: adminUser.id,
        reviewedAt: daysAgo(6),
      },
    });
  }
  console.log('  ✓ 1 stock adjustment created (approved damage)');

  // ============ Audit Logs ============
  console.log('\n📜 Creating sample audit logs...');
  const auditEntries = [
    { userId: adminUser.id, action: 'LOGIN', entityType: 'User', entityId: adminUser.id, timestamp: daysAgo(7), notes: 'Admin login from 192.168.1.100' },
    { userId: salesUser.id, action: 'LOGIN', entityType: 'User', entityId: salesUser.id, timestamp: daysAgo(5), notes: 'Sales officer login' },
    { userId: adminUser.id, action: 'CREATE', entityType: 'Invoice', entityId: 'demo', timestamp: daysAgo(5), notes: 'Created invoice INV-2025-001' },
    { userId: warehouseUser.id, action: 'CREATE', entityType: 'GatePass', entityId: 'demo', timestamp: daysAgo(5), notes: 'Gate pass GP-2025-002 issued' },
    { userId: accountantUser.id, action: 'CREATE', entityType: 'Expense', entityId: 'demo', timestamp: daysAgo(3), notes: 'Recorded forklift repair expense' },
    { userId: recoveryUser.id, action: 'CREATE', entityType: 'RecoveryVisit', entityId: 'demo', timestamp: daysAgo(2), notes: 'Recovery visit to Green Valley Homes' },
    { userId: adminUser.id, action: 'UPDATE', entityType: 'Client', entityId: c5.id, timestamp: daysAgo(1), notes: 'Updated recovery status for Green Valley Homes' },
    { userId: adminUser.id, action: 'LOGIN', entityType: 'User', entityId: adminUser.id, timestamp: today, notes: 'Admin login — morning session' },
  ];

  for (const log of auditEntries) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`  ✓ ${auditEntries.length} audit log entries created`);

  // ============ Summary ============
  console.log('\n' + '═'.repeat(60));
  console.log('🎭 DEMO SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log('   👥 Users: 5 (admin + warehouse + sales + accounts + recovery)');
  console.log('   🏭 Suppliers: 4');
  console.log('   📦 Products: 10 (across 5 categories)');
  console.log('   🏢 Warehouses: 2 with 10 bin locations');
  console.log('   📊 Inventory: 20 records (all products × both warehouses)');
  console.log('   👤 Clients: 7 (6 active + 1 inactive) with recovery assignments');
  console.log('   📋 Purchase Orders: 5');
  console.log('   🧾 Invoices: 15 (5 PAID, 3 PARTIAL, 5 PENDING, 2 OVERDUE)');
  console.log('   💰 Client Payments: with allocations');
  console.log('   💸 Supplier Payments: 2');
  console.log('   💳 Expenses: 10 (rent, utilities, salaries, transport, etc.)');
  console.log('   🚪 Gate Passes: 5');
  console.log('   🔄 Stock Transfers: 2');
  console.log('   📝 Stock Counts: 2');
  console.log('   ⚙️ Stock Adjustments: 1');
  console.log('   🚗 Recovery Visits: 7');
  console.log('   🤝 Payment Promises: 3 (1 broken, 2 pending)');
  console.log('   🔔 Alerts: 6');
  console.log('   📋 Alert Rules: 3');
  console.log('   📜 Journal Entries: auto-created for all transactions');
  console.log('   📊 Account Balances: updated to reflect all transactions');
  console.log('\n   📧 Demo Login Credentials:');
  console.log('   Admin:     admin@admin.com / admin123');
  console.log('   Warehouse: warehouse@hishamtraders.pk / demo123');
  console.log('   Sales:     sales@hishamtraders.pk / demo123');
  console.log('   Accounts:  accounts@hishamtraders.pk / demo123');
  console.log('   Recovery:  recovery@hishamtraders.pk / demo123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error during demo seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
