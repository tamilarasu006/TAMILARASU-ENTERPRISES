const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allProducts = await prisma.product.findMany();
  console.log('Total products:', allProducts.length);
  if (allProducts.length > 0) {
    console.log(allProducts.map(p => `${p.name} - isActive: ${p.isActive} - isAvailable: ${p.isAvailable}`));
  }
}

main().finally(() => prisma.$disconnect());
