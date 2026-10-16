export interface SuggestedAction {
  text: string;
  url?: string;
}

export interface ChatAttachment {
  url: string;
  filename: string;
  size?: number;
  type?: string;
  path?: string;
  folderPath?: string;
}

export interface ChatMessage {
  id?: string | number;
  /** Client-only key for messages that have no server id yet. */
  clientId?: string;
  role: 'user' | 'assistant';
  content: string;
  isHandoff?: boolean;
  requestContact?: boolean;
  suggestedActions?: Array<string | SuggestedAction>;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
  /** Local placeholder answer shown while the real reply is in flight. */
  pending?: boolean;
  /** User message the server never accepted. */
  failed?: boolean;
  attachments?: ChatAttachment[];
}

export interface ConversationPreview {
  id: string;
  title?: string;
  updatedAt: string;
  lastMessage?: string;
}

export type WidgetTab = 'chats' | 'orderFlow' | 'jobs' | 'orders' | 'gallery';

export type WidgetVariant = 'floating' | 'embedded' | 'page';

export interface ReframeCsOpenDetail {
  mode?: 'default' | 'feedback-escalation';
  issueType?: string;
  pageTitle?: string;
  pagePath?: string;
  prompt?: string;
  focus?: boolean;
}
