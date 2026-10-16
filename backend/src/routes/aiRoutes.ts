import express from 'express';
import { Response } from 'express';

/**
 * AI Routes — Disabled
 *
 * The Google Gemini proxy (/api/ai/gemini) has been removed.
 * AI features are now handled locally via rule-based matching (localResponses.ts)
 * and human escalation via Telegram.
 */
const router = express.Router();

router.all('*', (_req: any, res: Response) => {
  return res.status(410).json({
    success: false,
    message: 'The AI proxy endpoint has been removed. Chat is handled by the portal with local intelligence and Telegram escalation.'
  });
});

export default router;
