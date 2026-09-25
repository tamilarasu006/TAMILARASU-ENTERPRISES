const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('Connected to Prisma successfully');
    const count = await prisma.user.count();
    console.log('User count:', count);
  } catch (e) {
    console.error('Connection failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
