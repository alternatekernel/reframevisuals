// API service for communicating with the backend

// Safe fallback: use same-origin /api in production if VITE_API_URL is not baked in at build time
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

// Helper function to get auth token
const getToken = () => localStorage.getItem('reframe-token');

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (name: string, email: string, password: string) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  
  getProfile: () => apiRequest('/auth/profile'),
  
  updateProfile: (name: string) => 
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Sections API
export const sectionsAPI = {
  getAll: () => apiRequest('/sections'),
  
  get: (sectionId: string) => apiRequest(`/sections/${sectionId}`),
  
  save: (sectionId: string, label: string, content: any) => 
    apiRequest(`/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ label, content }),
    }),
  
  delete: (sectionId: string) => 
    apiRequest(`/sections/${sectionId}`, {
      method: 'DELETE',
    }),
};

// Theme API
export const themeAPI = {
  get: () => apiRequest('/theme'),
  
  update: (theme: any) => 
    apiRequest('/theme', {
      method: 'PUT',
      body: JSON.stringify(theme),
    }),
  
  reset: () => 
    apiRequest('/theme', {
      method: 'DELETE',
    }),
};

// Files API
export const filesAPI = {
  getAll: () => apiRequest('/files'),
  
  upload: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },
  
  delete: (id: string) => 
    apiRequest(`/files/${id}`, {
      method: 'DELETE',
    }),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health'),
};

// Quotes API
export const quotesAPI = {
  // Public: submit a quote request
  createRequest: (data: {
    customerName: string;
    customerEmail: string;
    description: string;
    quantity: number;
    returnFormat: string;
    wantVariations: boolean;
    selectedServices: Record<string, string>;
    sampleFiles: any[];
  }) =>
    apiRequest('/quotes/request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin: list quote requests
  getRequests: (status?: string) =>
    apiRequest(`/quotes/requests${status ? `?status=${status}` : ''}`),

  // Admin: get single quote request
  getRequest: (id: string) => apiRequest(`/quotes/requests/${id}`),

  // Admin: update quote request
  updateRequest: (id: string, data: { status?: string; adminNotes?: string }) =>
    apiRequest(`/quotes/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Admin: create a quote
  createQuote: (data: {
    requestId: string;
    services: Record<string, string>;
    turnaround: string;
    quantity: number;
    perImage: number;
    subtotal: number;
    discount: number;
    total: number;
    templateUsed?: string;
    documentation?: string;
  }) =>
    apiRequest('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin: list quotes
  getQuotes: () => apiRequest('/quotes'),

  // Admin: get single quote
  getQuote: (id: string) => apiRequest(`/quotes/${id}`),

  // Admin: send quote to customer
  sendQuote: (id: string) =>
    apiRequest(`/quotes/${id}/send`, {
      method: 'PATCH',
    }),
};

export default {
  auth: authAPI,
  sections: sectionsAPI,
  theme: themeAPI,
  files: filesAPI,
  health: healthAPI,
  quotes: quotesAPI,
};
