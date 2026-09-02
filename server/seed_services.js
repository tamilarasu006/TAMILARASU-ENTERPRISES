const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample services...');

  const services = [
    {
      title: 'Bulk Export',
      description: 'Reliable and timely bulk export of agricultural commodities worldwide.',
      category: 'Export',
      icon: 'globe',
      highlights: 'Global Reach,Timely Delivery,Custom Clearance',
      pricingQuotationRequired: true,
      isActive: true
    },
    {
      title: 'Custom Packaging',
      description: 'Tailored packaging solutions to meet international standards and protect product quality.',
      category: 'Packaging',
      icon: 'box',
      highlights: 'Eco-friendly,Private Labeling,Secure Packing',
      pricingQuotationRequired: true,
      isActive: true
    },
    {
      title: 'Quality Inspection',
      description: 'Rigorous quality checks and certifications for all shipments.',
      category: 'Quality Assurance',
      icon: 'check-circle',
      highlights: 'ISO Standards,Lab Testing,Compliance',
      pricingQuotationRequired: false,
      isActive: true
    }
  ];

  for (const service of services) {
    await prisma.service.create({
      data: service
    });
  }

  console.log('Sample services seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
