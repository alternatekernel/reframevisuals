// Vercel Unified Bridge
// This file bridges the entire Reframe Platform backend (Express) to Vercel Serverless.
import app from '../backend/src/index';

// Export the Express app as the default handler
export default app;
