const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating all products to be active...');
  
  const result = await prisma.product.updateMany({
    data: { isActive: true }
  });
  
  console.log(`Updated ${result.count} products to be active.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
