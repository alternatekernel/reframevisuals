import { Response } from 'express';
import { prisma } from '../../database';
import { safeError } from '../../utils/errors';

/**
 * Fetches the complete billing profile for the authenticated portal user.
 */
export const getBillingProfile = async (req: any, res: Response) => {
  try {
    const customerId = req.customer?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found' });
    }

    // Transform data for frontend
    const profile = {
      plan: customer.tier || 'Startup',
      status: customer.status === 'active' ? 'active' : 'inactive',
      currency: 'USD',
      usage: {
        consumed: (customer.creditLimit || 0) - (customer.creditBalance || 0),
        quota: customer.creditLimit || 500,
        balance: customer.creditBalance || 0,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()
      },
      paymentMethods: [],
      invoices: customer.invoices.map(inv => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        date: inv.createdAt.toLocaleDateString(),
        dueDate: inv.dueDate.toLocaleDateString(),
        paidAt: inv.paidAt ? inv.paidAt.toLocaleDateString() : null
      }))
    };

    return res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('[Billing] GetProfile Error:', error.message);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};

/**
 * Lists all invoices for the authenticated portal user.
 */
export const getInvoices = async (req: any, res: Response) => {
  try {
    const customerId = req.customer?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: invoices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};
