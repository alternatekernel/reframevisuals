import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding default theme...');

  // Check if default theme exists
  const existingTheme = await prisma.themeSetting.findFirst({
    where: { userId: null },
  });

  if (existingTheme) {
    console.log('✅ Default theme already exists:', existingTheme.id);
    return;
  }

  // Create default theme (userId: null = public theme)
  const defaultTheme = await prisma.themeSetting.create({
    data: {
      userId: null, // Default public theme
      brand: '#E97451',  // Your brand color (Coral/Terracotta)
      brandHover: '#D66140',  // Darker shade for hover
      surface: '#F8F9FD',
      onyx: '#0A0A0B',
      categoryFoundation: '#E97451',
      categoryEnhancement: '#E07A5F',
      categoryRetouch: '#3D8B7A',
      categoryAdvanced: '#D4A843',
      ambientOrb: '#CFC2FF',
      chatBubbles: '#F1F1F4',
      footerDark: '#050505',
      accentLavender: '#F8F6FF',
      heading: 'Satoshi',
      body: 'Satoshi',
      mono: 'JetBrains Mono',
      baseFontSize: 16,
      headingScale: 1.25,
      lineHeight: 1.6,
      letterSpacing: -0.02,
      radiusSm: 8,
      radiusMd: 16,
      radiusLg: 32,
      radiusXl: 64,
    },
  });

  console.log('✅ Default theme created:', defaultTheme.id);
  console.log('   Brand Color:', defaultTheme.brand);
  console.log('   Fonts:', defaultTheme.heading, '/', defaultTheme.body);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
