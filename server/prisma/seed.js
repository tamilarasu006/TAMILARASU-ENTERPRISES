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
  const defaultProducts = [
    {
      name: "Basmati Rice",
      description: "Premium aged long-grain aromatic basmati rice.",
      category: "Grains & Pulses",
      price: 100,
      priceOnRequest: false,
      unit: "kg",
      minimumOrderQuantity: 1,
      stock: 1000,
      imageUrl: "https://res.cloudinary.com/zwhqrwts/image/upload/v1788257528/tamilarasu_products/oo2qtwoiydtrjtj22m8e.jpg",
      origin: "India",
      packagingOptions: "25kg,50kg PP Bags",
      certifications: "ISO, FSSAI, APEDA",
      shelfLife: "24 months",
      tags: "rice,basmati,grains",
      isAvailable: true,
      exportAvailability: true,
      featuredProduct: true,
      isActive: true
    },
    {
      name: "Guntur Red Chilli",
      description: "Authentic fiery Guntur red chillies, sun-dried to perfection.",
      category: "Spices",
      price: 40,
      priceOnRequest: false,
      unit: "kg",
      minimumOrderQuantity: 20,
      stock: 300,
      imageUrl: "https://res.cloudinary.com/zwhqrwts/image/upload/v1788337882/tamilarasu_products/vq7sw6jvbrsvdzsabvog.jpg",
      origin: "India",
      packagingOptions: "10kg,25kg Jute Bags",
      certifications: "Spice Board, FSSAI",
      shelfLife: "12 months",
      tags: "chilli,spices,guntur",
      isAvailable: true,
      exportAvailability: true,
      featuredProduct: true,
      isActive: true
    },
    {
      name: "Organic Red Onions",
      description: "Fresh and organic red onions with long shelf life.",
      category: "Vegetables",
      price: 60,
      priceOnRequest: false,
      unit: "kg",
      minimumOrderQuantity: 100,
      stock: 2000,
      imageUrl: "https://res.cloudinary.com/zwhqrwts/image/upload/v1788337904/tamilarasu_products/o5pzepl4u2pslznvc29x.jpg",
      origin: "India",
      packagingOptions: "20kg,50kg Mesh Bags",
      certifications: "Organic, GlobalGAP",
      shelfLife: "3 months",
      tags: "onion,fresh,vegetables",
      isAvailable: true,
      exportAvailability: true,
      featuredProduct: false,
      isActive: true
    },
    {
      name: "Premium Alphonso Mango",
      description: "Hand-picked premium quality Alphonso mangoes from Ratnagiri.",
      category: "Fruits",
      price: 120,
      priceOnRequest: false,
      unit: "kg",
      minimumOrderQuantity: 50,
      stock: 500,
      imageUrl: "https://res.cloudinary.com/zwhqrwts/image/upload/v1788337929/tamilarasu_products/niqm3rrppeasiuwn7xgz.jpg",
      origin: "India",
      packagingOptions: "5kg Corrugated Boxes",
      certifications: "APEDA, GlobalGAP",
      shelfLife: "2 weeks",
      tags: "mango,alphonso,fruits",
      isAvailable: true,
      exportAvailability: true,
      featuredProduct: true,
      isActive: true
    }
  ];

  const productsPath = path.join(dataDir, 'products.json');
  const productsData = fs.existsSync(productsPath) 
    ? JSON.parse(fs.readFileSync(productsPath, 'utf8')) 
    : defaultProducts;

  for (const p of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          isAvailable: true,
          stock: existing.stock > 0 ? existing.stock : (p.stock || 500)
        }
      });
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description || '',
          category: p.category || 'General',
          price: p.price || 0,
          unit: p.unit || 'kg',
          minimumOrderQuantity: parseInt(p.minimumOrderQuantity) || 1,
          stock: p.stock || 500,
          imageUrl: p.imageUrl || '',
          origin: p.origin || 'India',
          packagingOptions: Array.isArray(p.packagingOptions) ? p.packagingOptions.join(',') : (p.packagingOptions || ''),
          certifications: Array.isArray(p.certifications) ? p.certifications.join(',') : (p.certifications || ''),
          shelfLife: p.shelfLife || '',
          tags: Array.isArray(p.tags) ? p.tags.join(',') : (p.tags || ''),
          isAvailable: p.isAvailable !== false,
          exportAvailability: p.exportAvailability !== false,
          featuredProduct: Boolean(p.featuredProduct),
          isActive: true
        }
      });
    }
  }
  console.log('Seeded Products');

  // 4. Seed Services
  const defaultServices = [
    {
      title: "Global Export & Logistics",
      description: "End-to-end freight forwarding, customs clearance, and refrigerated cold-chain logistics across international ports.",
      icon: "Ship",
      highlights: "Customs clearance,Cold-chain logistics,Worldwide shipping"
    },
    {
      title: "Quality Assurance & Inspection",
      description: "Rigorous quality checks, phytosanitary certifications, and laboratory testing meeting international food safety standards.",
      icon: "ShieldCheck",
      highlights: "Phytosanitary inspection,Lab testing,ISO/FSSAI compliance"
    },
    {
      title: "Custom B2B Packaging & Private Labeling",
      description: "Tailored bulk and retail packaging solutions adhering to destination country labeling regulations.",
      icon: "Boxes",
      highlights: "Private labeling,Custom sizing,Barcoding"
    }
  ];

  const servicesPath = path.join(dataDir, 'services.json');
  const servicesData = fs.existsSync(servicesPath)
    ? JSON.parse(fs.readFileSync(servicesPath, 'utf8'))
    : defaultServices;

  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({ where: { title: s.title } });
    if (!existing) {
      await prisma.service.create({
        data: {
          title: s.title,
          description: s.description,
          icon: s.icon || 'Star',
          highlights: Array.isArray(s.highlights) ? s.highlights.join(',') : (s.highlights || '')
        }
      });
    }
  }
  console.log('Seeded Services');

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
