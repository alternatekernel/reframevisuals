import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 Updating brand color to #E97451...');

  // Update default public theme
  await prisma.themeSetting.updateMany({
    where: { userId: null },
    data: {
      brand: '#E97451',
      brandHover: '#D66140',
      categoryFoundation: '#E97451',
    },
  });

  console.log('✅ Brand color updated successfully!');
  console.log('   New color: #E97451 (Coral/Terracotta)');
  console.log('   Hover color: #D66140');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
