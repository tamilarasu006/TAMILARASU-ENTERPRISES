const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { generateInvoicePDF } = require('./src/services/pdf.service');

const prisma = new PrismaClient();

async function main() {
  const invoice = await prisma.invoice.findFirst({
    include: { items: true, order: { include: { user: true } } }
  });
  if (!invoice) return console.log('No invoice found');

  const pt = fs.createWriteStream('./test_logo_pdf.pdf');
  await generateInvoicePDF(invoice, pt);
  console.log('PDF generated! Logo URL was:', invoice.companySnapshot.logoUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
