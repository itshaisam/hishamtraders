import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  console.table(users.map(u => ({ id: u.id.slice(0,12), email: u.email, name: u.name, tenantId: u.tenantId, role: u.role.name })));
  const tenants = await prisma.tenant.findMany();
  console.log('\nTenants:');
  console.table(tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug, status: t.status })));
}
main().finally(() => prisma.$disconnect());
