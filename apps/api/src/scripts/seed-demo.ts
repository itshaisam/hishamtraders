import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Starting DEMO data seed...');
  console.log('   This adds sample suppliers, products, warehouses, clients, POs, and invoices.\n');

  // ============ Get reference data created by base seed ============
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } });
  if (!adminUser) {
    throw new Error('Admin user not found. Run the base seed first: pnpm db:seed');
  }

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

  // ============ Suppliers ============
  console.log('Creating sample suppliers...');
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
  console.log('  ✓ Suppliers created (3 total)');

  // ============ Products ============
  console.log('Creating sample products...');
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
  console.log('  ✓ Products created (6 total)');

  // ============ Warehouses ============
  console.log('Creating sample warehouses...');
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
  console.log('  ✓ Warehouses created (2 total)');

  // ============ Inventory ============
  console.log('Creating sample inventory...');
  const mainWarehouse = await prisma.warehouse.findFirst({
    where: { name: 'Main Warehouse - Karachi' },
  });
  const sinkProduct = await prisma.product.findUnique({ where: { sku: 'SINK-001' } });
  const faucetProduct = await prisma.product.findUnique({ where: { sku: 'FAUCET-001' } });

  if (mainWarehouse && sinkProduct) {
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
  }

  if (mainWarehouse && faucetProduct) {
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
          quantity: 8,
          batchNo: 'SEED-BATCH-002',
          binLocation: 'A-01-002',
        },
      });

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
  }
  console.log('  ✓ Inventory created with stock movements');

  // ============ Clients ============
  console.log('Creating sample clients...');
  const clientsData = [
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
      balance: new Decimal('680000.00'),
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
      balance: new Decimal('220000.00'),
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
      balance: new Decimal('0.00'),
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
      status: 'INACTIVE' as const,
    },
  ];

  for (const client of clientsData) {
    const existing = await prisma.client.findFirst({
      where: { name: client.name },
    });
    if (!existing) {
      await prisma.client.create({ data: client });
    }
  }
  console.log('  ✓ Clients created (7 total)');

  // ============ Purchase Orders ============
  console.log('Creating sample purchase orders...');
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
        { productId: sinkProduct1?.id || '', quantity: 10, unitCost: new Decimal('150.00'), totalCost: new Decimal('1500.00') },
        { productId: sinkProduct2?.id || '', quantity: 8, unitCost: new Decimal('200.00'), totalCost: new Decimal('1600.00') },
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
        { productId: faucetProduct1?.id || '', quantity: 20, unitCost: new Decimal('75.00'), totalCost: new Decimal('1500.00') },
        { productId: faucetProduct2?.id || '', quantity: 25, unitCost: new Decimal('45.00'), totalCost: new Decimal('1125.00') },
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
        { productId: toiletProduct1?.id || '', quantity: 10, unitCost: new Decimal('120.00'), totalCost: new Decimal('1200.00') },
        { productId: toiletProduct2?.id || '', quantity: 8, unitCost: new Decimal('180.00'), totalCost: new Decimal('1440.00') },
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
        { productId: faucetProduct1?.id || '', quantity: 5, unitCost: new Decimal('75.00'), totalCost: new Decimal('375.00') },
      ],
    },
  ];

  for (const po of purchaseOrders) {
    const { items, ...poData } = po;
    await prisma.purchaseOrder.upsert({
      where: { poNumber: poData.poNumber },
      update: {},
      create: {
        ...poData,
        items: { create: items },
      },
    });
  }
  console.log('  ✓ Purchase orders created (4 total)');

  // ============ Invoices (migrated from seed_dashboard.sql) ============
  console.log('Creating sample invoices...');

  // Look up clients and products by name/sku
  const c1 = await prisma.client.findFirst({ where: { name: { startsWith: 'ABC Construction' } } });
  const c2 = await prisma.client.findFirst({ where: { name: { startsWith: 'Paradise Builders' } } });
  const c3 = await prisma.client.findFirst({ where: { name: { startsWith: 'Metro Plumbing' } } });
  const c4 = await prisma.client.findFirst({ where: { name: { startsWith: 'Royal Interiors' } } });
  const c5 = await prisma.client.findFirst({ where: { name: { startsWith: 'Green Valley' } } });
  const w1 = await prisma.warehouse.findFirst({ where: { name: 'Main Warehouse - Karachi' } });
  const w2 = await prisma.warehouse.findFirst({ where: { name: 'Islamabad Branch Warehouse' } });
  const p1 = await prisma.product.findUnique({ where: { sku: 'SINK-001' } });
  const p2 = await prisma.product.findUnique({ where: { sku: 'SINK-002' } });
  const p3 = await prisma.product.findUnique({ where: { sku: 'FAUCET-001' } });
  const p4 = await prisma.product.findUnique({ where: { sku: 'FAUCET-002' } });
  const p5 = await prisma.product.findUnique({ where: { sku: 'TOILET-001' } });
  const p6 = await prisma.product.findUnique({ where: { sku: 'TOILET-002' } });

  if (!c1 || !c2 || !c3 || !c4 || !c5 || !w1 || !w2 || !p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
    console.log('  ⚠ Skipping invoices - missing required data');
  } else {
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
    const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

    // Helper to generate sequential invoice numbers
    let invoiceSeq = 1;
    const nextInvNum = () => {
      const num = String(invoiceSeq++).padStart(3, '0');
      return `INV-DEMO-${num}`;
    };

    const invoicesData: Array<{
      invoiceNumber: string;
      clientId: string;
      warehouseId: string;
      invoiceDate: Date;
      dueDate: Date;
      paymentType: 'CREDIT' | 'CASH';
      subtotal: Decimal;
      taxAmount: Decimal;
      taxRate: Decimal;
      total: Decimal;
      paidAmount: Decimal;
      status: 'PENDING' | 'PARTIAL' | 'PAID';
      items: Array<{ productId: string; quantity: number; unitPrice: Decimal; discount: Decimal; total: Decimal }>;
    }> = [
      {
        invoiceNumber: nextInvNum(), clientId: c1.id, warehouseId: w1.id,
        invoiceDate: daysAgo(28), dueDate: daysFromNow(2), paymentType: 'CREDIT',
        subtotal: new Decimal('2500'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('2500'), paidAmount: new Decimal('0'), status: 'PENDING',
        items: [
          { productId: p1.id, quantity: 5, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('1250') },
          { productId: p3.id, quantity: 10, unitPrice: new Decimal('125'), discount: new Decimal('0'), total: new Decimal('1250') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c2.id, warehouseId: w1.id,
        invoiceDate: daysAgo(25), dueDate: daysFromNow(5), paymentType: 'CASH',
        subtotal: new Decimal('4200'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('4200'), paidAmount: new Decimal('4200'), status: 'PAID',
        items: [
          { productId: p6.id, quantity: 10, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('3200') },
          { productId: p4.id, quantity: 5, unitPrice: new Decimal('85'), discount: new Decimal('0'), total: new Decimal('425') },
          { productId: p3.id, quantity: 4, unitPrice: new Decimal('125'), discount: new Decimal('5'), total: new Decimal('475') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c3.id, warehouseId: w2.id,
        invoiceDate: daysAgo(22), dueDate: daysFromNow(8), paymentType: 'CREDIT',
        subtotal: new Decimal('7500'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('7500'), paidAmount: new Decimal('2000'), status: 'PARTIAL',
        items: [
          { productId: p1.id, quantity: 20, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('5000') },
          { productId: p2.id, quantity: 5, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('1750') },
          { productId: p4.id, quantity: 8, unitPrice: new Decimal('85'), discount: new Decimal('5'), total: new Decimal('750') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c4.id, warehouseId: w1.id,
        invoiceDate: daysAgo(20), dueDate: daysFromNow(10), paymentType: 'CASH',
        subtotal: new Decimal('1600'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('1600'), paidAmount: new Decimal('1600'), status: 'PAID',
        items: [
          { productId: p5.id, quantity: 8, unitPrice: new Decimal('200'), discount: new Decimal('0'), total: new Decimal('1600') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c5.id, warehouseId: w2.id,
        invoiceDate: daysAgo(18), dueDate: daysFromNow(12), paymentType: 'CREDIT',
        subtotal: new Decimal('9600'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('9600'), paidAmount: new Decimal('0'), status: 'PENDING',
        items: [
          { productId: p6.id, quantity: 20, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('6400') },
          { productId: p1.id, quantity: 8, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('2000') },
          { productId: p3.id, quantity: 8, unitPrice: new Decimal('125'), discount: new Decimal('5'), total: new Decimal('1200') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c1.id, warehouseId: w1.id,
        invoiceDate: daysAgo(15), dueDate: daysFromNow(15), paymentType: 'CASH',
        subtotal: new Decimal('3550'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('3550'), paidAmount: new Decimal('3550'), status: 'PAID',
        items: [
          { productId: p2.id, quantity: 6, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('2100') },
          { productId: p4.id, quantity: 15, unitPrice: new Decimal('85'), discount: new Decimal('0'), total: new Decimal('1275') },
          { productId: p5.id, quantity: 1, unitPrice: new Decimal('200'), discount: new Decimal('10'), total: new Decimal('175') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c2.id, warehouseId: w1.id,
        invoiceDate: daysAgo(12), dueDate: daysFromNow(18), paymentType: 'CREDIT',
        subtotal: new Decimal('12800'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('12800'), paidAmount: new Decimal('5000'), status: 'PARTIAL',
        items: [
          { productId: p6.id, quantity: 25, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('8000') },
          { productId: p1.id, quantity: 12, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('3000') },
          { productId: p4.id, quantity: 20, unitPrice: new Decimal('85'), discount: new Decimal('5'), total: new Decimal('1800') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c3.id, warehouseId: w2.id,
        invoiceDate: daysAgo(10), dueDate: daysFromNow(20), paymentType: 'CASH',
        subtotal: new Decimal('5200'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('5200'), paidAmount: new Decimal('5200'), status: 'PAID',
        items: [
          { productId: p2.id, quantity: 10, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('3500') },
          { productId: p3.id, quantity: 12, unitPrice: new Decimal('125'), discount: new Decimal('0'), total: new Decimal('1500') },
          { productId: p5.id, quantity: 1, unitPrice: new Decimal('200'), discount: new Decimal('0'), total: new Decimal('200') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c4.id, warehouseId: w1.id,
        invoiceDate: daysAgo(7), dueDate: daysFromNow(23), paymentType: 'CREDIT',
        subtotal: new Decimal('15000'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('15000'), paidAmount: new Decimal('0'), status: 'PENDING',
        items: [
          { productId: p1.id, quantity: 30, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('7500') },
          { productId: p6.id, quantity: 15, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('4800') },
          { productId: p2.id, quantity: 5, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('1750') },
          { productId: p3.id, quantity: 6, unitPrice: new Decimal('125'), discount: new Decimal('5'), total: new Decimal('950') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c5.id, warehouseId: w2.id,
        invoiceDate: daysAgo(5), dueDate: daysFromNow(25), paymentType: 'CASH',
        subtotal: new Decimal('6400'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('6400'), paidAmount: new Decimal('6400'), status: 'PAID',
        items: [
          { productId: p6.id, quantity: 12, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('3840') },
          { productId: p4.id, quantity: 20, unitPrice: new Decimal('85'), discount: new Decimal('0'), total: new Decimal('1700') },
          { productId: p5.id, quantity: 4, unitPrice: new Decimal('200'), discount: new Decimal('2'), total: new Decimal('860') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c1.id, warehouseId: w1.id,
        invoiceDate: daysAgo(3), dueDate: daysFromNow(27), paymentType: 'CREDIT',
        subtotal: new Decimal('8500'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('8500'), paidAmount: new Decimal('3000'), status: 'PARTIAL',
        items: [
          { productId: p1.id, quantity: 15, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('3750') },
          { productId: p2.id, quantity: 8, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('2800') },
          { productId: p3.id, quantity: 15, unitPrice: new Decimal('125'), discount: new Decimal('2'), total: new Decimal('1950') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c3.id, warehouseId: w1.id,
        invoiceDate: daysAgo(2), dueDate: daysFromNow(28), paymentType: 'CASH',
        subtotal: new Decimal('2720'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('2720'), paidAmount: new Decimal('2720'), status: 'PAID',
        items: [
          { productId: p6.id, quantity: 5, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('1600') },
          { productId: p4.id, quantity: 8, unitPrice: new Decimal('85'), discount: new Decimal('0'), total: new Decimal('680') },
          { productId: p5.id, quantity: 2, unitPrice: new Decimal('200'), discount: new Decimal('2'), total: new Decimal('440') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c2.id, warehouseId: w2.id,
        invoiceDate: daysAgo(1), dueDate: daysFromNow(29), paymentType: 'CREDIT',
        subtotal: new Decimal('11200'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('11200'), paidAmount: new Decimal('0'), status: 'PENDING',
        items: [
          { productId: p1.id, quantity: 20, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('5000') },
          { productId: p6.id, quantity: 10, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('3200') },
          { productId: p2.id, quantity: 4, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('1400') },
          { productId: p3.id, quantity: 10, unitPrice: new Decimal('125'), discount: new Decimal('4'), total: new Decimal('1600') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c4.id, warehouseId: w1.id,
        invoiceDate: now, dueDate: daysFromNow(30), paymentType: 'CASH',
        subtotal: new Decimal('4800'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('4800'), paidAmount: new Decimal('4800'), status: 'PAID',
        items: [
          { productId: p6.id, quantity: 10, unitPrice: new Decimal('320'), discount: new Decimal('0'), total: new Decimal('3200') },
          { productId: p1.id, quantity: 4, unitPrice: new Decimal('250'), discount: new Decimal('0'), total: new Decimal('1000') },
          { productId: p4.id, quantity: 6, unitPrice: new Decimal('85'), discount: new Decimal('5'), total: new Decimal('600') },
        ],
      },
      {
        invoiceNumber: nextInvNum(), clientId: c5.id, warehouseId: w2.id,
        invoiceDate: now, dueDate: daysFromNow(30), paymentType: 'CREDIT',
        subtotal: new Decimal('3500'), taxAmount: new Decimal('0'), taxRate: new Decimal('0'), total: new Decimal('3500'), paidAmount: new Decimal('0'), status: 'PENDING',
        items: [
          { productId: p2.id, quantity: 6, unitPrice: new Decimal('350'), discount: new Decimal('0'), total: new Decimal('2100') },
          { productId: p3.id, quantity: 8, unitPrice: new Decimal('125'), discount: new Decimal('0'), total: new Decimal('1000') },
          { productId: p5.id, quantity: 2, unitPrice: new Decimal('200'), discount: new Decimal('0'), total: new Decimal('400') },
        ],
      },
    ];

    let createdCount = 0;
    for (const inv of invoicesData) {
      const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
      if (existing) continue;

      const { items, ...invoiceData } = inv;
      await prisma.invoice.create({
        data: {
          ...invoiceData,
          items: { create: items },
        },
      });
      createdCount++;
    }
    console.log(`  ✓ Invoices created (${createdCount} invoices with line items)`);
  }

  console.log('\n🎭 Demo seed completed successfully!');
  console.log('   You now have a fully populated system for demos and testing.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during demo seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
