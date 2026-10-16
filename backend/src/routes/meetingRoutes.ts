import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { authenticate } from '../middleware/auth';
import { emailService } from '../services/emailService';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/meeting/submit
 * Submit a new meeting request (public - no auth required)
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { name, email, company, message } = req.body;

    // Validation
    if (!name || !email || !company || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, company, message',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Create meeting request
    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        name,
        email,
        company,
        message,
        status: 'pending',
      },
    });

    // Create a lead entry if one doesn't exist for this email
    prisma.lead.findFirst({ where: { email } }).then(existing => {
      if (!existing) {
        return prisma.lead.create({
          data: { name, email, company, source: 'book-meeting', status: 'new', score: 0 },
        });
      }
      return null;
    }).catch(err => console.warn('[Meeting] Failed to create lead:', err));

    // Send email notification to admin
    await emailService.sendMeetingNotificationEmail(meetingRequest).catch(err => {
      console.error('Failed to send admin notification for meeting:', err);
    });

    return res.status(201).json({
      success: true,
      data: meetingRequest,
      message: 'Meeting request submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting meeting request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit meeting request',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES (Require Authentication)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/meeting/requests
 * Get all meeting requests with pagination and filtering
 */
router.get('/requests', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.meetingRequest.count({ where });

    // Get meeting requests
    const meetingRequests = await prisma.meetingRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    return res.json({
      success: true,
      data: meetingRequests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching meeting requests:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting requests',
    });
  }
});

/**
 * GET /api/meeting/requests/:id
 * Get a single meeting request by ID
 */
router.get('/requests/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const meetingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
    });

    if (!meetingRequest) {
      return res.status(404).json({
        success: false,
        error: 'Meeting request not found',
      });
    }

    return res.json({
      success: true,
      data: meetingRequest,
    });
  } catch (error: any) {
    console.error('Error fetching meeting request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting request',
    });
  }
});

/**
 * PATCH /api/meeting/requests/:id
 * Update a meeting request (status, admin notes, scheduled time)
 */
router.patch('/requests/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, scheduledAt } = req.body;

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);

    const meetingRequest = await prisma.meetingRequest.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      data: meetingRequest,
      message: 'Meeting request updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating meeting request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update meeting request',
    });
  }
});

/**
 * DELETE /api/meeting/requests/:id
 * Delete a meeting request
 */
router.delete('/requests/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.meetingRequest.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Meeting request deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting meeting request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete meeting request',
    });
  }
});

/**
 * GET /api/meeting/stats
 * Get meeting request statistics
 */
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
  try {
    // FIX #3: Single groupBy query replaces 5 separate COUNT queries.
    const grouped = await prisma.meetingRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const byStatus: Record<string, number> = {};
    for (const g of grouped) byStatus[g.status] = g._count.id;
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending: byStatus['pending'] ?? 0,
          contacted: byStatus['contacted'] ?? 0,
          confirmed: byStatus['confirmed'] ?? 0,
          completed: byStatus['completed'] ?? 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching meeting stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting stats',
    });
  }
});

export default router;
