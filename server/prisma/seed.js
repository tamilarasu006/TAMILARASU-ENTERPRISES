const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, '../../temp_repo/data');

async function main() {
  console.log('Starting seed...');

  // 1. Seed SiteConfig
  const siteConfigPath = path.join(dataDir, 'site_config.json');
  if (fs.existsSync(siteConfigPath)) {
    const configData = JSON.parse(fs.readFileSync(siteConfigPath, 'utf8'));
    for (const [key, value] of Object.entries(configData)) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
        create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
      });
    }
    console.log('Seeded SiteConfig');
  }

  // 2. Seed About info into SiteConfig
  const aboutPath = path.join(dataDir, 'about.json');
  if (fs.existsSync(aboutPath)) {
    const aboutData = JSON.parse(fs.readFileSync(aboutPath, 'utf8'));
    await prisma.siteConfig.upsert({
      where: { key: 'about_company' },
      update: { value: JSON.stringify(aboutData) },
      create: { key: 'about_company', value: JSON.stringify(aboutData) },
    });
    console.log('Seeded About Company Data');
  }

  // 3. Seed Products
  const productsPath = path.join(dataDir, 'products.json');
  if (fs.existsSync(productsPath)) {
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    for (const p of productsData) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          description: p.description,
          category: p.category,
          price: 0, // Not provided in JSON, set to 0 initially
          unit: p.unit || 'kg',
          minimumOrderQuantity: parseInt(p.minimumOrderQuantity) || 100,
          stock: 1000, // Mock stock
          imageUrl: p.imageUrl,
          origin: p.origin,
          packagingOptions: p.packagingOptions ? p.packagingOptions.join(',') : '',
          certifications: p.certifications ? p.certifications.join(',') : '',
          shelfLife: p.shelfLife,
          tags: p.tags ? p.tags.join(',') : '',
          isAvailable: p.isAvailable !== false,
        },
        create: {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          price: 0,
          unit: p.unit || 'kg',
          minimumOrderQuantity: parseInt(p.minimumOrderQuantity) || 100,
          stock: 1000,
          imageUrl: p.imageUrl,
          origin: p.origin,
          packagingOptions: p.packagingOptions ? p.packagingOptions.join(',') : '',
          certifications: p.certifications ? p.certifications.join(',') : '',
          shelfLife: p.shelfLife,
          tags: p.tags ? p.tags.join(',') : '',
          isAvailable: p.isAvailable !== false,
        }
      });
    }
    console.log('Seeded Products');
  }

  // 4. Seed Services
  const servicesPath = path.join(dataDir, 'services.json');
  if (fs.existsSync(servicesPath)) {
    const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    for (const s of servicesData) {
      await prisma.service.upsert({
        where: { id: s.id },
        update: {
          title: s.title,
          description: s.description,
          icon: s.icon,
          highlights: s.highlights ? s.highlights.join(',') : ''
        },
        create: {
          id: s.id,
          title: s.title,
          description: s.description,
          icon: s.icon,
          highlights: s.highlights ? s.highlights.join(',') : ''
        }
      });
    }
    console.log('Seeded Services');
  }

  // 5. Seed Admin User
  const adminEmail = 'admin@tamilarasuenterprises.com';
  const adminPass = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Site Admin',
      email: adminEmail,
      password: adminPass,
      role: 'ADMIN'
    }
  });
  console.log('Seeded Admin User (admin@tamilarasuenterprises.com / admin123)');

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
