import type { ChatMessage, SuggestedAction } from './types';

export const STORAGE = {
  conversationId: 'reframe_cs_conv_id',
  messages: 'reframe_cs_messages',
  adminBaseline: 'reframe_cs_last_admin_msg_id',
  pinned: 'reframe_cs_pinned_chats',
  identity: 'reframe_cs_identity',
  contactCaptured: 'reframe_cs_contact_captured',
  guestId: 'portal_guest_id',
  portalToken: 'portal_token',
  orderDraft: 'reframe_order_draft',
  introSeen: 'reframe_cs_intro_seen',
} as const;

export const CONVERSATION_EVENT = 'reframe-cs:conversation';

export const DEFAULT_STARTER_ACTIONS: SuggestedAction[] = [
  { text: 'Get a Quote', url: '/free-trial' },
  { text: 'Our Services', url: '/services' },
  { text: 'Pricing Bundles', url: '/pricing' },
  { text: 'Assurance Support' },
];

export const greetingMessage = (
  intro = 'How can I help?',
  suggestedActions: ChatMessage['suggestedActions'] = DEFAULT_STARTER_ACTIONS,
): ChatMessage => ({ clientId: 'greeting', role: 'assistant', content: intro, suggestedActions });

export const POLL_MS = { viewing: 5000, background: 15000, hidden: 30000 } as const;

export const MAX_CACHED_MESSAGES = 150;
export const SAME_GROUP_MS = 60 * 1000;
export const BOTTOM_THRESHOLD_PX = 80;

export const CTA_PHRASES_DESKTOP = [
  'Ask Reframe CS.',
  'Need pricing or turnaround?',
  'Ask about file prep.',
  'Human replies instantly.',
  'Share your project.',
  'Get a quote.',
];

export const CTA_PHRASES_MOBILE = [
  'Ask anything about our editing services.',
  'How much for 500 product photos?',
  'What turnaround options do you offer?',
  "Tell us about your project, we'll quote it.",
  'Need ghost mannequin or jewelry retouching?',
  'Ask about bulk pricing and volume discounts.',
];

export const CTA_DWELL_MS = [5200, 2600, 2600, 2600, 2600, 2600];

/** Tabs rendered inside the widget; every other nav item links out to its page. */
export const IN_WIDGET_TABS = new Set(['jobs', 'orders', 'gallery']);
