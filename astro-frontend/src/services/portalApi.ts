import axios from 'axios';

// Safe fallback: use same-origin /api in production if VITE_API_URL is not baked in at build time
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

const api = axios.create({
  baseURL: `${API_URL}`,
  withCredentials: true,
});

// Generate or get guest ID for unauthenticated users
const getGuestId = () => {
  let guestId = localStorage.getItem('portal_guest_id');
  if (!guestId) {
    guestId = 'guest_' + crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem('portal_guest_id', guestId);
  }
  return guestId;
};

// Add auth token or guest ID to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portal_token');
  config.headers['x-guest-id'] = getGuestId();
  if (token && token !== 'null') {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const portalApi = {
  // Customer portal auth. Keep these on /portal/auth so tokens contain customer IDs,
  // not staff/user IDs, otherwise dashboard/order/chat routes cannot resolve the customer.
  login: (email: string, password: string) => api.post('/portal/auth/login', { email, password }),
  register: (data: any) => api.post('/portal/auth/register', data),
  googleAuth: (credential: string) => api.post('/portal/auth/google', { credential }),
  logout: () => api.post('/portal/auth/logout'),
  getMe: () => api.get('/portal/auth/me'),
  updateProfile: (data: any) => api.put('/portal/profile', data),
  deleteProfileData: () => api.delete('/portal/profile'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),

  // Chat
  getConversations: () => api.get('/portal/conversations'),
  getConversationDetails: (id: string) => api.get(`/portal/conversations/${id}`),
  getConversationRealtime: (id: string) => api.get(`/portal/conversations/${id}/realtime`),
  sendMessage: (content: string, conversationId?: string) => 
    api.post('/portal/chat', { content, conversationId, guestId: getGuestId() }),
  getSupportAvailability: () => api.get('/portal/chat/support-availability'),

  // Orders
  getOrders: (params?: { status?: string; limit?: number }) => api.get('/portal/orders', { params }),
  getOrderDetails: (id: string) => api.get(`/portal/orders/${id}`),
  approveOrder: (id: string) => api.post(`/portal/orders/${id}/approve`),
  requestRevision: (id: string, notes: string) => api.post(`/portal/orders/${id}/revision`, { notes }),
  rejectProposal: (id: string, notes: string) => api.post(`/portal/orders/${id}/reject-proposal`, { notes }),
  cancelOrder: (id: string) => api.delete(`/portal/orders/${id}/cancel`),

  // Billing
  getBillingProfile: () => api.get('/portal/billing/profile'),

  // Feedback / Notification
  submitFeedback: (data: {
    type: string;
    subject: string;
    message: string;
    email: string;
    url?: string;
  }) => api.post('/portal/feedback', data),
};
