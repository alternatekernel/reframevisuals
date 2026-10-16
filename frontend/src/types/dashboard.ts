export type JobStatus = 'In Review' | 'In Progress' | 'In Revision' | 'Complete' | 'Submitted' | 'Pending Approval' | 'delivered' | 'processing' | 'review';

export interface JobImage {
  id: string;
  name: string;
  url?: string;
  beforeUrl?: string;
  afterUrl?: string;
  type?: string; // 'work' = main image, 'support' = support/reference image
}

export interface Job {
  id: string;
  name: string;
  title?: string;
  description?: string;
  expectedCompletion?: string | null;
  deliveryLink?: string | null;
  deliveryNote?: string | null;
  status: JobStatus;
  rawStatus?: string;
  imageCount: number;
  itemCount?: number;
  date: string;
  createdAtRaw?: string;
  progress?: number;
  services: string[];
  images?: JobImage[];
  isPriority?: boolean;
  totalPrice?: string;
  deliveredFiles?: JobImage[];
  code?: string;
  customFilesLink?: string;
  customFilesCount?: number;
  quotation?: any;
  completedAt?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: string;
}

export interface AiData {
  suggestedActions?: { text: string; url?: string }[];
  quickReplies?: string[];
}

export interface ParsedMessage extends Message {
  aiData?: AiData;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: string;
  unread?: boolean;
  messages?: Message[];
}

export interface OrderTemplate {
  id: string;
  name: string;
  services: string[];
  specs: {
    format: string;
    background?: string;
    sizing?: string;
    turnaround?: string;
    cropRatio?: string;
    colorProfile?: string;
    resolutionDPI?: string;
    layering?: 'Flat' | 'Layered';
    namingPattern?: string;
    marginPercent?: string;
    deliveryVector?: string;
    resizeWidth?: string;
    resizeHeight?: string;
    maintainAspectRatio?: boolean;
    customBgColor?: string;
    customBgFileName?: string;
  };
  instructions?: string;
  createdAt: string;
}

export type ViewType = 'jobs' | 'orders' | 'billing' | 'account' | 'chat' | 'orderFlow' | 'templates' | 'gallery';

export type NavItemType = ViewType;

export interface DashboardStats {
  total: number;
  active: number;
  completed: number;
  images: number;
}

export const STATUS_CONFIG: Record<JobStatus, { color: string; label: string }> = {
  'In Review': { color: '#0a72ef', label: 'In QC' },
  'In Progress': { color: '#f59e0b', label: 'In Progress' },
  'In Revision': { color: '#dc2626', label: 'Revision' },
  'Complete': { color: '#16a34a', label: 'Done' },
  'Submitted': { color: '#171717', label: 'Submitted' },
  'Pending Approval': { color: '#7c3aed', label: 'Awaiting Approval' },
  'delivered': { color: '#16a34a', label: 'Delivered' },
  'processing': { color: '#0a72ef', label: 'Processing' },
  'review': { color: '#f59e0b', label: 'Review' },
};

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface UsageStats {
  consumed: number;
  quota: number;
  resetDate: string;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
  dueDate: string;
  paidAt: string | null;
}

export interface BillingProfile {
  plan: string;
  status: 'active' | 'past_due' | 'canceled' | 'inactive';
  paymentMethods: PaymentMethod[];
  usage: UsageStats;
  invoices: Invoice[];
}