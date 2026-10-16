import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Diagnosis ---');

  const servicesSection = await prisma.section.findFirst({
    where: { sectionId: 'services' }
  });

  if (servicesSection) {
    const content = JSON.parse(servicesSection.content);
    console.log(`✅ Services Section Found. Total Services: ${content.items?.length || 0}`);
    const hasModelRetouch = content.items?.some((s: any) => s.id === 'model-retouch');
    console.log(`🔍 Has Model Retouch: ${hasModelRetouch ? 'YES' : 'NO'}`);
  } else {
    console.log('❌ Services Section NOT Found');
  }

  const specsPolicy = await prisma.platformPolicy.findUnique({
    where: { key: 'SERVICE_SPECS' }
  });

  if (specsPolicy) {
    const content = JSON.parse(specsPolicy.content);
    const totalSpecs = Object.keys(content).length;
    console.log(`✅ Service Specs Policy Found. Total Specs: ${totalSpecs}`);
    console.log(`🔍 Has Model Retouch Spec: ${content['model-retouch'] ? 'YES' : 'NO'}`);
  } else {
    console.log('❌ Service Specs Policy NOT Found');
  }

  const pages = await prisma.platformPage.findMany();
  console.log(`✅ Total Platform Pages: ${pages.length}`);

  const pricingPolicy = await prisma.platformPolicy.findUnique({
    where: { key: 'PRICING_MATRIX' }
  });
  if (pricingPolicy) {
    console.log('✅ Pricing Matrix Policy Found');
  } else {
    console.log('❌ Pricing Matrix Policy NOT Found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
