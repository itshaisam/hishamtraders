import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NOTE: This seed script ONLY creates global reference data (not tenant-scoped).
// To create a tenant with admin user, accounts, and settings, use:
//   pnpm db:create-tenant --name "Company" --slug "company" --admin-email "admin@co.com" --admin-password "pass"

async function main() {
  console.log('🌱 Starting database seed (reference data only)...\n');

  // ============ Roles ============
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
  console.log('  ✓ Roles created (5 total)');

  // ============ Countries ============
  console.log('Creating countries...');
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

  // ============ Payment Terms ============
  console.log('Creating payment terms...');
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

  // ============ Product Categories ============
  console.log('Creating product categories...');
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

  // ============ Brands ============
  console.log('Creating brands...');
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

  // ============ Units of Measure ============
  console.log('Creating units of measure...');
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

  console.log('\n✓ Reference data seeded successfully');
  console.log('\n📋 Next step: Create a tenant with:');
  console.log('   pnpm db:create-tenant --name "Company Name" --slug "slug" --admin-email "admin@co.com" --admin-password "password"');
  console.log('🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
