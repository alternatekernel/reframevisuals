import { Response } from 'express';
import { prisma } from '../../database';
import { safeError } from '../../utils/errors';

/**
 * Aggregates recent activity (orders, messages, invoices) for the dashboard feed.
 */
export const getRecentActivity = async (req: any, res: Response) => {
  try {
    const customerId = req.customer?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch recent orders
    const orders = await prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        createdAt: true
      }
    });

    // Fetch recent invoices
    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true
      }
    });

    // Fetch recent conversations/messages
    const conversations = await prisma.conversation.findMany({
      where: { customerId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Aggregate and sort
    const activity: any[] = [];

    orders.forEach(o => {
      activity.push({
        id: `order-${o.id}`,
        type: 'order',
        title: o.title,
        status: o.status,
        code: o.code,
        timestamp: o.createdAt,
        message: `Order #${o.code} is currently ${o.status.toLowerCase()}.`
      });
    });

    invoices.forEach(i => {
      activity.push({
        id: `invoice-${i.id}`,
        type: 'invoice',
        amount: i.amount,
        status: i.status,
        timestamp: i.createdAt,
        message: `Invoice for $${i.amount} was ${i.status.toLowerCase()}.`
      });
    });

    conversations.forEach(c => {
      if (c.messages.length > 0) {
        const lastMsg = c.messages[0];
        activity.push({
          id: `chat-${c.id}`,
          type: 'chat',
          title: c.title || 'Support Chat',
          timestamp: lastMsg.createdAt,
          message: lastMsg.role === 'assistant' ? `Support: "${lastMsg.content.substring(0, 50)}..."` : `You: "${lastMsg.content.substring(0, 50)}..."`
        });
      }
    });

    // Sort by timestamp descending
    const sortedActivity = activity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 10);

    return res.json({ success: true, data: sortedActivity });
  } catch (error: any) {
    console.error('[Activity] Error:', error.message);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};
