const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding admin user and sample product...');

  const adminEmail = 'admin@tamilarasuenterprises.com';
  const adminPass = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Site Admin',
      email: adminEmail,
      password: adminPass,
      role: 'ADMIN',
      emailVerified: true
    }
  });
  console.log('Admin user seeded!');

  // Check if there are any products, if not add a sample one
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.create({
      data: {
        name: 'Sample Product',
        description: 'This is a sample product to show how it looks.',
        category: 'All',
        price: 15.99,
        unit: 'kg',
        minimumOrderQuantity: 10,
        stock: 100,
        isAvailable: true,
        isActive: true
      }
    });
    console.log('Sample product seeded!');
  } else {
    console.log('Products already exist.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
