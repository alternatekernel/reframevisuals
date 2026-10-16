import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupGuests() {
  console.log('--- Starting Guest Cleanup Routine ---');
  
  // Define inactivity period (48 hours)
  const inactivityThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  try {
    // 1. Find inactive guests
    const inactiveGuests = await prisma.customer.findMany({
      where: {
        isGuest: true,
        updatedAt: { lt: inactivityThreshold },
        // Ensure they don't have active orders or quotes that we want to keep
        orders: { none: {} },
        quotations: { none: {} }
      },
      select: { id: true }
    });

    if (inactiveGuests.length === 0) {
      console.log('No inactive guest accounts found.');
      return;
    }

    console.log(`Found ${inactiveGuests.length} inactive guest accounts to delete.`);

    // 2. Delete conversations and messages for these guests first (cascading cleanup)
    for (const guest of inactiveGuests) {
      const conversations = await prisma.conversation.findMany({
        where: { customerId: guest.id }
      });
      
      for (const conv of conversations) {
        await prisma.message.deleteMany({
          where: { conversationId: conv.id }
        });
      }
      
      await prisma.conversation.deleteMany({
        where: { customerId: guest.id }
      });
    }

    // 3. Delete the guest customer records
    const deleteResult = await prisma.customer.deleteMany({
      where: {
        id: { in: inactiveGuests.map(g => g.id) }
      }
    });

    console.log(`Successfully deleted ${deleteResult.count} guest records.`);
  } catch (error) {
    console.error('Guest cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupGuests();
