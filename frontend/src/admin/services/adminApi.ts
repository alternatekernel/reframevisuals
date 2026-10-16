// Admin API Service Layer
// Centralized API calls for admin dashboard

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

// Metrics
export interface HeroMetrics {
  slaHealth: {
    value: number;
    trend: number;
    target: number;
    status: 'good' | 'warning' | 'critical';
    timestamp: string;
  };
  capacityUtilization: {
    value: number;
    available: number;
    total: number;
    trend: number;
    timestamp: string;
  };
  activeOrders: {
    value: number;
    breakdown: {
      new: number;
      inProgress: number;
      readyQC: number;
    };
    trend: number;
    timestamp: string;
  };
  weeklyRevenue: {
    value: number;
    currency: string;
    trend: number;
    timestamp: string;
  };
}

// Orders & Kanban
export interface KanbanColumn {
  status: string;
  label: string;
  orders: Order[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalImages: number;
  completedImages: number;
  expectedCompletion: string;
  createdAt: string;
  assignedEditorId?: string;
  totalPrice?: number;
}

// Editors
export interface Editor {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'busy';
  capacity: number;
  currentLoad: number;
  completedToday: number;
  avgTurnaround: number;
  qualityScore: number;
}

// Quotations
export interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  totalAmount: number;
  items: QuotationItem[];
  createdAt: string;
  expiresAt?: string;
}

export interface QuotationItem {
  serviceType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

// Finance
export interface FinanceDashboard {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  outstandingInvoices: number;
  pendingPayouts: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

// Tasks
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
}

// Support
export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
}

// Leads
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  source: string;
  createdAt: string;
}

// Assets
export interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}


// Alerts
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  createdAt: string;
  dismissed: boolean;
}

export interface TelegramStatus {
  configured: boolean;
  webhookSecretConfigured: boolean;
  adminChatConfigured: boolean;
  botTokenConfigured: boolean;
  topics: Record<'urgent' | 'orders' | 'payments' | 'leads' | 'chat' | 'system', boolean>;
}

export interface TelegramStatusResponse {
  success: boolean;
  data: TelegramStatus;
}

export interface SlackStatus {
  configured: boolean;
  botTokenConfigured: boolean;
  signingSecretConfigured: boolean;
  defaultChannelConfigured: boolean;
}

export interface SlackStatusResponse {
  success: boolean;
  data: SlackStatus;
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getAuthorizationHeader(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = {
        code: 'NETWORK_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    // Handle 401 Unauthorized - Only clear tokens, NEVER redirect from here.
    // Redirecting here caused the login loop: getProfile returned 401 immediately
    // after a fresh login, wiping the new token before AdminLayout could use it.
    // ProtectedRoute and AdminLayout handle all auth-based navigation.
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_target_tenant_id');
    }
    
    // Backend wraps errors as { error: { code, message } }; unwrap if present.
    const errBody = error?.error ?? error;
    return { error: { code: errBody?.code || `HTTP_${response.status}`, message: errBody?.message || response.statusText || `HTTP ${response.status}` } };
  }
  const data = await response.json();
  return { data };
}

// Helper to get targetTenantId for admin to view specific customer data
function getTargetTenantId(): string | undefined {
  // This can be set when admin selects a specific customer to view
  return localStorage.getItem('admin_target_tenant_id') || undefined;
}

// Admin utilities for managing tenant context
export const adminTenant = {
  // Set the target tenant when admin views a specific customer's data
  setTargetTenant: (tenantId: string) => {
    localStorage.setItem('admin_target_tenant_id', tenantId);
  },
  
  // Clear target tenant to return to platform-wide view
  clearTargetTenant: () => {
    localStorage.removeItem('admin_target_tenant_id');
  },
  
  // Get current target tenant
  getTargetTenant: () => {
    return localStorage.getItem('admin_target_tenant_id') || null;
  },
  
  // Check if admin is viewing a specific customer
  isViewingCustomer: () => {
    return !!localStorage.getItem('admin_target_tenant_id');
  },
};

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('admin_token');
  // Guard against stringified null/undefined — happens when token is saved as null
  if (token === 'null' || token === 'undefined') {
    localStorage.removeItem('admin_token');
    return {
      error: { code: 'AUTH_ERROR', message: 'Invalid session state' }
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Add targetTenantId for admin customer views, but never on the production
    // Kanban board. Production must stay platform-wide; a stale customer context
    // in localStorage can otherwise make the board look empty.
    const targetTenantId = getTargetTenantId();
    const shouldScopeToTenant = targetTenantId && !endpoint.startsWith('/kanban');
    const url = shouldScopeToTenant
      ? `${API_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}targetTenantId=${targetTenantId}`
      : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options?.headers,
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        error: { code: 'TIMEOUT', message: 'Request timed out after 15s' }
      };
    }
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export const adminApi = {
  // ─── Auth ──────────────────────────────────────────────────
  auth: {
    login: (credentials: LoginRequest) =>
      fetchApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    getProfile: () => fetchApi('/auth/profile'),
  },

  // ─── Metrics ───────────────────────────────────────────────
  metrics: {
    getHero: () => fetchApi<HeroMetrics>('/metrics/hero'),
  },

  // ─── Orders & Kanban ───────────────────────────────────────
  orders: {
    getKanban: (archived = false) => fetchApi<KanbanColumn[]>(`/kanban${archived ? '?archived=true' : ''}`),
    getOrder: (id: string) => fetchApi<Order>(`/orders/${id}`),
    updateOrder: (id: string, data: Partial<Order>) =>
      fetchApi<Order>(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    createOrder: (data: Partial<Order>) =>
      fetchApi<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateImageStatus: (imageId: string, data: { status: string }) =>
      fetchApi(`/images/${imageId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getActivities: (id: string) => fetchApi(`/orders/${id}/activities`),
    addActivity: (id: string, message: string) =>
      fetchApi(`/orders/${id}/activities`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    updatePosition: (id: string, position: number) =>
      fetchApi(`/orders/${id}/position`, {
        method: 'PATCH',
        body: JSON.stringify({ position }),
      }),
    archive: (id: string) => fetchApi(`/orders/${id}/archive`, { method: 'POST' }),
    unarchive: (id: string) => fetchApi(`/orders/${id}/unarchive`, { method: 'POST' }),
  },

  // ─── Editors ───────────────────────────────────────────────
  editors: {
    getAll: () => fetchApi<Editor[]>('/editors'),
    getById: (id: string) => fetchApi<Editor>(`/editors/${id}`),
    getPerformance: (id: string) => fetchApi(`/editors/${id}/performance`),
    update: (id: string, data: Partial<Editor>) =>
      fetchApi<Editor>(`/editors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    create: (data: Partial<Editor>) =>
      fetchApi<Editor>('/editors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/editors/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Quotations ────────────────────────────────────────────
  quotations: {
    getAll: () => fetchApi<Quotation[]>('/quotations'),
    getById: (id: string) => fetchApi<Quotation>(`/quotations/${id}`),
    create: (data: Partial<Quotation>) =>
      fetchApi<Quotation>('/quotations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Quotation>) =>
      fetchApi<Quotation>(`/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    convertToOrder: (id: string) =>
      fetchApi<Order>(`/quotations/${id}/convert-to-order`, {
        method: 'POST',
      }),
    delete: (id: string) =>
      fetchApi(`/quotations/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Finance ───────────────────────────────────────────────
  finance: {
    getDashboard: () => fetchApi<FinanceDashboard>('/finance/dashboard'),
    getInvoices: () => fetchApi<Invoice[]>('/finance/invoices'),
    createInvoice: (data: Partial<Invoice>) =>
      fetchApi<Invoice>('/finance/invoices', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Tasks ─────────────────────────────────────────────────
  tasks: {
    getAll: () => fetchApi<Task[]>('/tasks'),
    create: (data: Partial<Task>) =>
      fetchApi<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Task>) =>
      fetchApi<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/tasks/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Support ───────────────────────────────────────────────
  support: {
    getTickets: () => fetchApi<SupportTicket[]>('/support/tickets'),
    createTicket: (data: Partial<SupportTicket>) =>
      fetchApi<SupportTicket>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTicket: (id: string, data: Partial<SupportTicket>) =>
      fetchApi<SupportTicket>(`/support/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    sendEmail: (data: { to: string; subject: string; body: string }) =>
      fetchApi('/support/emails', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Leads ─────────────────────────────────────────────────
  leads: {
    getAll: () => fetchApi<Lead[]>('/business/leads'),
    create: (data: Partial<Lead>) =>
      fetchApi<Lead>('/business/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Lead>) =>
      fetchApi<Lead>(`/business/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi(`/business/leads/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Assets ────────────────────────────────────────────────
  assets: {
    getAll: () => fetchApi<Asset[]>('/assets'),
    upload: async (file: File): Promise<ApiResponse<Asset>> => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch(`${API_BASE_URL}/files`, {
          method: 'POST',
          headers: getAuthorizationHeader(),
          body: formData,
        });
        return handleResponse<Asset>(response);
      } catch (error) {
        return {
          error: {
            code: 'UPLOAD_ERROR',
            message: error instanceof Error ? error.message : 'Upload failed',
          },
        };
      }
    },
    delete: (id: string) =>
      fetchApi(`/assets/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Alerts ────────────────────────────────────────────────
  alerts: {
    getAll: () => fetchApi<Alert[]>('/alerts'),
    dismiss: (id: string) =>
      fetchApi<Alert>(`/alerts/${id}/dismiss`, {
        method: 'PATCH',
      }),
    create: (data: Partial<Alert>) =>
      fetchApi<Alert>('/alerts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Pricing ───────────────────────────────────────────────
  pricing: {
    getCustomerTiers: () => fetchApi('/pricing/customer-tiers'),
    getEditorTiers: () => fetchApi('/pricing/editor-tiers'),
    getMarginGuard: () => fetchApi('/pricing/margin-guard'),
    updateCustomerTier: (id: string, data: any) =>
      fetchApi(`/pricing/customer-tiers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // ─── Payouts ───────────────────────────────────────────────
  payouts: {
    getBatches: () => fetchApi('/payouts/batches'),
    getBatch: (id: string) => fetchApi(`/payouts/batches/${id}`),
    approveBatch: (id: string) =>
      fetchApi(`/payouts/batches/${id}/approve`, {
        method: 'PATCH',
      }),
    createBatch: (data: any) =>
      fetchApi('/payouts/batches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // ─── Business Operations ───────────────────────────────────
  business: {
    getAttendance: () => fetchApi('/business/attendance'),
    getPayroll: () => fetchApi('/business/payroll'),
    getPartners: () => fetchApi('/business/partners'),
    getKnowledge: () => fetchApi('/business/knowledge'),
    getChatbotConfig: () => fetchApi('/business/chatbot'),
    updateChatbotConfig: (data: any) => {
      const tenantId = data?.tenantId || localStorage.getItem('admin_target_tenant_id') || 'reframe-primary';
      return fetchApi(`/business/chatbot/${encodeURIComponent(tenantId)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    getNPS: () => fetchApi('/business/nps'),
    getReferrals: () => fetchApi('/business/referrals'),
  },

  // ─── Operations ────────────────────────────────────────────
  operations: {
    getQC: () => fetchApi('/operations/qc/dashboard'),
    approveQCBatch: (id: string) =>
      fetchApi(`/operations/qc/batches/${id}/approve`, { method: 'POST' }),
    rejectQCBatch: (id: string, notes?: string) =>
      fetchApi(`/operations/qc/batches/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    getTeam: () => fetchApi('/operations/team/directory'),
    getEmployee: (id: string) => fetchApi(`/operations/team/employees/${id}`),
    createTeam: (data: any) =>
      fetchApi('/operations/team', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTeam: (id: string, data: any) =>
      fetchApi(`/operations/team/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getNDA: () => fetchApi('/operations/nda/contracts'),
    createNDA: (data: any) =>
      fetchApi('/operations/nda/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStyleGuide: () => fetchApi('/operations/styleguide'),
    updateStyleGuide: (data: any) =>
      fetchApi('/operations/styleguide', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getWatchlist: () => fetchApi('/operations/watchlist'),
  },

  // ─── Telegram Notifications ───────────────────────────────
  telegram: {
    getStatus: () => fetchApi<TelegramStatusResponse>('/telegram/status'),
    sendTest: (topic = 'system') => fetchApi<{ success: boolean; message: string }>('/telegram/test', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),
  },

  // ─── Slack Notifications ──────────────────────────────────
  slack: {
    getStatus: () => fetchApi<SlackStatusResponse>('/slack/status'),
    sendTest: (topic = 'system') => fetchApi<{ success: boolean; message: string }>('/slack/test', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),
  },

  // ─── Search ────────────────────────────────────────────────
  search: {
    search: (query: string) => fetchApi(`/search?q=${encodeURIComponent(query)}`),
  },

  // ─── Customers ──────────────────────────────────────────────
  customers: {
    getAll: () => fetchApi<{ customers: any[] }>('/business/customers'),
    getById: (id: string) => fetchApi<{ customer: any }>(`/business/customers/${id}`),
    create: (data: any) =>
      fetchApi('/business/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export default adminApi;
