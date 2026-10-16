import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting brand color migration in database...');

  const result = await prisma.themeSetting.updateMany({
    data: {
      brand: '#E97451',
      brandHover: '#D66140',
      categoryFoundation: '#E97451',
      categoryEnhancement: '#E07A5F',
      ambientOrb: '#FFF1EC', // Updated from Lavender to Peach
      accentLavender: '#FFFBF9', // Updated to Cream
    }
  });

  console.log(`Successfully updated ${result.count} theme settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
