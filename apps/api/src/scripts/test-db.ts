import { prisma } from '../lib/prisma.js';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test connection
    await prisma.$connect();
    console.log('✓ Database connection successful');

    // Count records
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const auditLogCount = await prisma.auditLog.count();

    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Audit Logs: ${auditLogCount}`);

    // Fetch sample data
    if (roleCount > 0) {
      console.log('\n📋 Roles:');
      const roles = await prisma.role.findMany();
      roles.forEach((role) => {
        console.log(`   - ${role.name}: ${role.description}`);
      });
    }

    if (userCount > 0) {
      console.log('\n👤 Users:');
      const users = await prisma.user.findMany({
        include: { role: true },
      });
      users.forEach((user) => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role.name}`);
      });
    }

    console.log('\n✅ Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
