const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Database Brand Fix: Started');
  try {
    const result = await prisma.themeSetting.updateMany({
      data: {
        brand: '#E97451',
        brandHover: '#D66140',
        categoryFoundation: '#E97451',
        ambientOrb: '#FFF1EC',
        accentLavender: '#FFFBF9',
      }
    });
    console.log(`Success: Updated ${result.count} theme settings.`);
  } catch (err) {
    console.error('Migration Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
