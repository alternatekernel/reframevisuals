import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('mysql://')) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env.production'), override: true });
}

const prisma = new PrismaClient();

async function diagnose() {
  try {
    const sections = await prisma.section.findMany({
      where: { sectionId: 'services' }
    });
    
    console.log('--- SECTIONS FOUND ---');
    sections.forEach(s => {
      console.log(`ID: ${s.id}, sectionId: ${s.sectionId}, label: ${s.label}`);
      const content = JSON.parse(s.content as string);
      console.log('Items IDs:', content.items?.map((i: any) => i.id));
      console.log('Items Names:', content.items?.map((i: any) => i.name));
      
      const retouchingItem = content.items?.find((i: any) => i.id === 'retouching' || i.id === 'basic-retouch' || i.name.toLowerCase().includes('retouch'));
      if (retouchingItem) {
        console.log('Found Retouching Item:', JSON.stringify(retouchingItem, null, 2));
      } else {
        console.log('Retouching item NOT found in this section');
      }
    });
    
  } catch (error) {
    console.error('Diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
