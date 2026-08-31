const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  console.log('Admin:', admin);
}
check().finally(() => prisma.$disconnect());
