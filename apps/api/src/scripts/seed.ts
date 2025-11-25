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
  console.log('  ✓ Sample suppliers created (3 total)');

  // Sample Products
  console.log('  Creating sample products...');
  const products = [
    {
      sku: 'SINK-001',
      name: 'Stainless Steel Kitchen Sink 33x22',
      categoryId: sinksCategory?.id,
      brandId: superSinkBrand?.id,
      costPrice: new Decimal('150.00'),
      sellingPrice: new Decimal('250.00'),
      reorderLevel: 10,
    },
    {
      sku: 'SINK-002',
      name: 'Double Bowl Undermount Sink',
      categoryId: sinksCategory?.id,
      brandId: superSinkBrand?.id,
      costPrice: new Decimal('200.00'),
      sellingPrice: new Decimal('350.00'),
      reorderLevel: 8,
    },
    {
      sku: 'FAUCET-001',
      name: 'Chrome Kitchen Faucet with Sprayer',
      categoryId: faucetsCategory?.id,
      brandId: eliteFaucetBrand?.id,
      costPrice: new Decimal('75.00'),
      sellingPrice: new Decimal('125.00'),
      reorderLevel: 20,
    },
    {
      sku: 'FAUCET-002',
      name: 'Brass Basin Faucet Hot/Cold',
      categoryId: faucetsCategory?.id,
      brandId: eliteFaucetBrand?.id,
      costPrice: new Decimal('45.00'),
      sellingPrice: new Decimal('85.00'),
      reorderLevel: 25,
    },
    {
      sku: 'TOILET-001',
      name: 'Ceramic Western Toilet Seat',
      categoryId: toiletsCategory?.id,
      brandId: classicToiletBrand?.id,
      costPrice: new Decimal('120.00'),
      sellingPrice: new Decimal('200.00'),
      reorderLevel: 10,
    },
    {
      sku: 'TOILET-002',
      name: 'Dual Flush Toilet with Soft Close',
      categoryId: toiletsCategory?.id,
      brandId: classicToiletBrand?.id,
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
  console.log('  ✓ Sample products created (6 total)');

  // Sample Purchase Orders
  console.log('  Creating sample purchase orders...');
  const beijingSupplier = await prisma.supplier.findUnique({ where: { name: 'Beijing Ceramics Co.' } });
  const karachiSupplier = await prisma.supplier.findUnique({ where: { name: 'Karachi Fixtures Ltd.' } });
  const shanghaiSupplier = await prisma.supplier.findUnique({ where: { name: 'Shanghai Bathroom Supplies' } });

  const sinkProduct1 = await prisma.product.findUnique({ where: { sku: 'SINK-001' } });
  const sinkProduct2 = await prisma.product.findUnique({ where: { sku: 'SINK-002' } });
  const faucetProduct1 = await prisma.product.findUnique({ where: { sku: 'FAUCET-001' } });
  const faucetProduct2 = await prisma.product.findUnique({ where: { sku: 'FAUCET-002' } });
  const toiletProduct1 = await prisma.product.findUnique({ where: { sku: 'TOILET-001' } });
  const toiletProduct2 = await prisma.product.findUnique({ where: { sku: 'TOILET-002' } });

  const purchaseOrders = [
    {
      poNumber: 'PO-2025-001',
      supplierId: beijingSupplier?.id || '',
      orderDate: new Date('2025-01-10'),
      expectedArrivalDate: new Date('2025-02-10'),
      status: 'PENDING' as const,
      totalAmount: new Decimal('2700.00'),
      notes: 'Initial order for sink inventory from Beijing',
      items: [
        {
          productId: sinkProduct1?.id || '',
          quantity: 10,
          unitCost: new Decimal('150.00'),
          totalCost: new Decimal('1500.00'),
        },
        {
          productId: sinkProduct2?.id || '',
          quantity: 8,
          unitCost: new Decimal('200.00'),
          totalCost: new Decimal('1600.00'),
        },
      ],
    },
    {
      poNumber: 'PO-2025-002',
      supplierId: karachiSupplier?.id || '',
      orderDate: new Date('2025-01-15'),
      expectedArrivalDate: new Date('2025-01-30'),
      status: 'IN_TRANSIT' as const,
      totalAmount: new Decimal('3200.00'),
      notes: 'Faucet fixtures from Karachi - rush delivery',
      items: [
        {
          productId: faucetProduct1?.id || '',
          quantity: 20,
          unitCost: new Decimal('75.00'),
          totalCost: new Decimal('1500.00'),
        },
        {
          productId: faucetProduct2?.id || '',
          quantity: 25,
          unitCost: new Decimal('45.00'),
          totalCost: new Decimal('1125.00'),
        },
      ],
    },
    {
      poNumber: 'PO-2025-003',
      supplierId: shanghaiSupplier?.id || '',
      orderDate: new Date('2025-01-05'),
      expectedArrivalDate: new Date('2025-02-05'),
      status: 'RECEIVED' as const,
      totalAmount: new Decimal('3200.00'),
      notes: 'Toilet units received and inspected',
      items: [
        {
          productId: toiletProduct1?.id || '',
          quantity: 10,
          unitCost: new Decimal('120.00'),
          totalCost: new Decimal('1200.00'),
        },
        {
          productId: toiletProduct2?.id || '',
          quantity: 8,
          unitCost: new Decimal('180.00'),
          totalCost: new Decimal('1440.00'),
        },
      ],
    },
    {
      poNumber: 'PO-2025-004',
      supplierId: beijingSupplier?.id || '',
      orderDate: new Date('2025-01-20'),
      expectedArrivalDate: null,
      status: 'CANCELLED' as const,
      totalAmount: new Decimal('0.00'),
      notes: 'Cancelled due to supplier stock unavailability',
      items: [
        {
          productId: faucetProduct1?.id || '',
          quantity: 5,
          unitCost: new Decimal('75.00'),
          totalCost: new Decimal('375.00'),
        },
      ],
    },
  ];

  for (const po of purchaseOrders) {
    const { items, ...poData } = po;
    const createdPO = await prisma.purchaseOrder.upsert({
      where: { poNumber: poData.poNumber },
      update: {},
      create: {
        ...poData,
        items: {
          create: items,
        },
      },
    });
  }
  console.log('  ✓ Sample purchase orders created (4 total)');

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
