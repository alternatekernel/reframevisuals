/**
 * Frontend AI utility — Gemini proxy removed.
 *
 * Chat AI is now handled server-side via:
 *   - localResponses.ts (rule-based instant replies)
 *   - Telegram escalation (human handoff)
 *
 * This file is kept as a stub to avoid import errors in any legacy components.
 * callGemini now calls the portal chat endpoint directly.
 */

const API_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

// Legacy export — now a no-op that logs a deprecation warning
export const callGemini = async (_prompt: string, _systemInstruction: string): Promise<any> => {
  console.warn('[ai.ts] callGemini is deprecated. Use portalApi.sendMessage() instead.');
  return { content: '', aiData: {} };
};

export { API_URL };
