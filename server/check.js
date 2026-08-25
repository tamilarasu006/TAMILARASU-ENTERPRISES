const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetAdminPassword() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'admin@tamilarasuenterprises.com' },
    data: { password: hashedPassword }
  });
  console.log("Admin password reset to 'admin123'");
}

resetAdminPassword().catch(console.error).finally(() => prisma.$disconnect());
