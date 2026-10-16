export type SlashCommandId = 'pricing' | 'services' | 'order' | 'human' | 'status';

export interface SlashCommand {
  id: SlashCommandId;
  trigger: string;
  label: string;
  message: string;
}

export const CORE_SLASH_COMMANDS: SlashCommand[] = [
  { id: 'pricing', trigger: '/pricing', label: 'Pricing', message: 'Show me your pricing' },
  { id: 'services', trigger: '/services', label: 'Services', message: 'Tell me about your services' },
  { id: 'order', trigger: '/order', label: 'Place Order', message: 'I want to place an order' },
  { id: 'human', trigger: '/human', label: 'Talk to Human', message: 'I need human support' },
  { id: 'status', trigger: '/status', label: 'Order Status', message: 'Check my order status' },
];

export const resolveSlashCommand = (text: string): SlashCommand | null => {
  const key = text.trim().toLowerCase().split(/\s+/)[0];
  return CORE_SLASH_COMMANDS.find((cmd) => cmd.trigger === key) || null;
};

type DraftState = {
  value: string;
  updatedAt: number;
};

const draftKey = (conversationId: string) => `reframe_chat_draft:${conversationId}`;

export const saveDraft = (conversationId: string, value: string) => {
  const payload: DraftState = { value, updatedAt: Date.now() };
  localStorage.setItem(draftKey(conversationId), JSON.stringify(payload));
};

export const loadDraft = (conversationId: string): string => {
  const raw = localStorage.getItem(draftKey(conversationId));
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as DraftState;
    return parsed.value || '';
  } catch {
    return '';
  }
};

export const clearDraft = (conversationId: string) => {
  localStorage.removeItem(draftKey(conversationId));
};
