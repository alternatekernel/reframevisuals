import { Request, Response } from 'express';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth';

// ─── Customer: Submit a quote request ───

export const createQuoteRequest = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      description,
      quantity,
      returnFormat,
      wantVariations,
      selectedServices,
      sampleFiles,
    } = req.body;

    if (!customerName || !customerEmail || !description || !quantity || !returnFormat || !selectedServices) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        customerName,
        customerEmail,
        description,
        quantity: Number(quantity),
        returnFormat,
        wantVariations: Boolean(wantVariations),
        selectedServices: typeof selectedServices === 'string' ? selectedServices : JSON.stringify(selectedServices),
        sampleFiles: typeof sampleFiles === 'string' ? sampleFiles : JSON.stringify(sampleFiles || []),
        status: 'pending',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      data: quoteRequest,
    });
  } catch (error: any) {
    console.error('Create quote request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit quote request',
      error: error.message,
    });
  }
};

// ─── Admin: List all quote requests ───

export const getQuoteRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const requests = await prisma.quoteRequest.findMany({
      where,
      include: {
        quotes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error('Get quote requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quote requests',
      error: error.message,
    });
  }
};

// ─── Admin: Get single quote request ───

export const getQuoteRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quoteRequest) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found',
      });
    }

    return res.json({
      success: true,
      data: quoteRequest,
    });
  } catch (error: any) {
    console.error('Get quote request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quote request',
      error: error.message,
    });
  }
};

// ─── Admin: Update quote request status / notes ───

export const updateQuoteRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const quoteRequest = await prisma.quoteRequest.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Quote request updated',
      data: quoteRequest,
    });
  } catch (error: any) {
    console.error('Update quote request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update quote request',
      error: error.message,
    });
  }
};

// ─── Admin: Create a quote for a request ───

export const createQuote = async (req: AuthRequest, res: Response) => {
  try {
    const {
      requestId,
      services,
      turnaround,
      quantity,
      perImage,
      subtotal,
      discount,
      total,
      templateUsed,
      documentation,
    } = req.body;

    if (!requestId || !services || !turnaround || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Verify request exists
    const request = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Quote request not found',
      });
    }

    const quote = await prisma.quote.create({
      data: {
        requestId,
        services: typeof services === 'string' ? services : JSON.stringify(services),
        turnaround,
        quantity: Number(quantity),
        perImage: Number(perImage),
        subtotal: Number(subtotal),
        discount: Number(discount),
        total: Number(total),
        templateUsed: templateUsed || null,
        documentation: documentation || null,
        status: 'draft',
      },
    });

    // Update request status to 'quoted'
    await prisma.quoteRequest.update({
      where: { id: requestId },
      data: { status: 'quoted' },
    });

    return res.status(201).json({
      success: true,
      message: 'Quote created successfully',
      data: quote,
    });
  } catch (error: any) {
    console.error('Create quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create quote',
      error: error.message,
    });
  }
};

// ─── Admin: List all quotes ───

export const getAllQuotes = async (_req: Request, res: Response) => {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        request: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: quotes,
    });
  } catch (error: any) {
    console.error('Get quotes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quotes',
      error: error.message,
    });
  }
};

// ─── Admin: Get single quote ───

export const getQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        request: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    return res.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('Get quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get quote',
      error: error.message,
    });
  }
};

// ─── Admin: Send quote to customer (stub) ───

export const sendQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    // Update quote status
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    // Update request status
    await prisma.quoteRequest.update({
      where: { id: quote.requestId },
      data: { status: 'sent' },
    });

    console.warn(`[EMAIL STUB] Quote ${id} marked sent for ${quote.request.customerEmail}`);

    return res.json({
      success: true,
      message: `Quote sent to ${quote.request.customerEmail}`,
      data: updatedQuote,
    });
  } catch (error: any) {
    console.error('Send quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send quote',
      error: error.message,
    });
  }
};
