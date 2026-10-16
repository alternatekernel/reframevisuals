import { Router } from 'express';
import {
  createQuoteRequest,
  getQuoteRequests,
  getQuoteRequest,
  updateQuoteRequest,
  createQuote,
  getAllQuotes as getQuotes,
  getQuote,
  sendQuote,
} from '../controllers/quoteController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: customer submits a quote request
router.post('/request', createQuoteRequest);

// Admin: manage quote requests
router.get('/requests', authenticate, requireAdmin, getQuoteRequests);
router.get('/requests/:id', authenticate, requireAdmin, getQuoteRequest);
router.patch('/requests/:id', authenticate, requireAdmin, updateQuoteRequest);

// Admin: manage quotes
router.post('/', authenticate, requireAdmin, createQuote);
router.get('/', authenticate, requireAdmin, getQuotes);
router.get('/:id', authenticate, requireAdmin, getQuote);
router.patch('/:id/send', authenticate, requireAdmin, sendQuote);

export default router;
