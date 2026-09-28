const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
prisma.invoiceSettings.update({
  where: { id: 'default' },
  data: { logoUrl: '/uploads/logo.png' }
}).then(res => console.log('Logo updated!'))
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
