import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('[AdminBootstrap] Admin bootstrap configuration is incomplete; skipping.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'admin',
        passwordHash: passwordHash
      }
    });
    console.log('[AdminBootstrap] Updated admin account.');
    return;
  }

  await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  });

  console.log('[AdminBootstrap] Created admin user.');
}

ensureAdmin()
  .catch((error) => {
    console.error('[AdminBootstrap] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
