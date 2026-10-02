const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPseudo = 'devadmin';

  const existing = await prisma.user.findUnique({
    where: { pseudo: adminPseudo },
  });

  if (existing) {
    console.log('Compte admin existe déjà.');
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const hashed = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      pseudo: adminPseudo,
      password: hashed,
      role: 'admin',
    },
  });

  console.log('Compte admin créé :');
  console.log('  Pseudo : ' + adminPseudo);
  console.log('  MDP    : ' + adminPassword);
  console.log('  Role   : admin');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
