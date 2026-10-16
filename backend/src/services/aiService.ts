import { getLocalResponse, getGenericFallbackResponse } from './localResponses';

const systemInstruction = `You are a professional, helpful customer support representative for Reframe Visuals (an image editing and retouching platform).
Your task is to draft or refine a polite, clear, and professional email reply to a customer support ticket.

Guidelines:
1. Output ONLY the email body itself. Do not include any meta-text like "Here is the email draft:" or "Subject: ...".
2. Keep the tone warm, helpful, and professional.
3. Address the customer's request/issues directly using the provided context and history.
4. Keep paragraphs short and readable.
5. If the admin provided rough notes or directives, incorporate them into the email reply.
6. Use placeholders like [Customer Name] only if they are not clear from the context. Otherwise, use actual names (e.g. if the customer name is John, write "Hi John,").
7. Always end the email with this exact signature block:
   Best regards,
   Maruf Hasan
   Customer Support
   Reframe Visuals
8. If the admin is asking to refine an existing draft, modify the existing draft according to their refinement instructions (e.g. make it warmer, shorter, add specific details), keeping the exact signature block at the end.`;

/**
 * Generate a professional support email reply draft using Gemini 1.5 Flash.
 */
export async function generateSupportEmailDraft(
  ticket: { subject: string; message: string; customer?: { name?: string | null } },
  history: { content: string; senderRole: string }[],
  roughNotes: string,
  currentDraft?: string | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  // Build the conversation transcript for Gemini
  const chatHistoryText = history
    .map(msg => `${msg.senderRole === 'admin' ? 'REPRESENTATIVE (ADMIN)' : 'CUSTOMER'}: ${msg.content}`)
    .join('\n\n');

  const userPrompt = [
    `Ticket Subject: ${ticket.subject}`,
    `Original Ticket Message:\n${ticket.message}`,
    `\n--- CONVERSATION HISTORY ---`,
    chatHistoryText || '(No previous messages)',
    currentDraft ? `\n--- CURRENT DRAFT TO REFINE ---\n${currentDraft}` : '',
    `\n--- ADMIN'S INSTRUCTIONS / ROUGH NOTES ---`,
    currentDraft 
      ? `Refine the current draft based on this instruction: "${roughNotes}"`
      : `Draft a professional email reply based on these notes: "${roughNotes}"`
  ].filter(Boolean).join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result: any = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text.trim();
}

/**
 * AI Service — Local Rule-Based Fallback (Backward Compatibility)
 */
export const callGemini = async (prompt: string, _systemInstruction: string, _allowPlainText: boolean = false): Promise<any> => {
  console.log('[AI Service] callGemini fallback. Resolving via local-only matching.');

  const lines = prompt.split('\n');
  const userLine = lines
    .slice()
    .reverse()
    .map(l => l.trim())
    .find(l => /^(USER:|CUSTOMER'S MESSAGE:)\s*/i.test(l));
  const userMessage = userLine
    ? userLine.replace(/^(USER:|CUSTOMER'S MESSAGE:)\s*/i, '').trim()
    : 'Help me';

  const localMatch = getLocalResponse(userMessage);
  if (localMatch) {
    return {
      content: localMatch.content,
      aiData: { suggestedActions: localMatch.suggestedActions || [] }
    };
  }

  const fallback = getGenericFallbackResponse();
  return {
    content: fallback.content,
    aiData: { suggestedActions: fallback.suggestedActions || [] }
  };
};
