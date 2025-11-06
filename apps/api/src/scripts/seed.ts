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
