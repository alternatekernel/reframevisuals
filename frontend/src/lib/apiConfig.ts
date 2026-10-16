// Centralized API configuration
// Use this for all API calls instead of hardcoding URLs

const getApiBaseUrl = (): string => {
  // Try Vite environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to runtime variable (for different deployment environments)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Default to localhost for development
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');
  }
  
  // Production fallback - should be set via environment variable
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const getApiEndpoint = (endpoint: string): string => {
  // Remove trailing slashes from the base URL
  let base = API_BASE_URL.replace(/\/+$/, '');
  
  // Ensure base ends with /api if it's a full URL or if it's the root /api
  // but avoid double /api
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  
  // Normalize endpoint (ensure it starts with / and remove double slashes)
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${base}${normalizedEndpoint}`;
};

/**
 * Headers every authenticated portal request needs. Several call sites used to send
 * only X-Guest-ID, which made the server resolve a logged-in customer as a guest —
 * their orders were then invisible and downloads failed.
 */
export const portalAuthHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Guest-ID': (typeof window !== 'undefined' && localStorage.getItem('portal_guest_id')) || '',
    ...extra,
  };
  const token = typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null;
  if (token && token !== 'null') headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const portalFetch = (endpoint: string, init: RequestInit = {}) =>
  fetch(getApiEndpoint(endpoint), {
    ...init,
    credentials: 'include',
    headers: portalAuthHeaders((init.headers as Record<string, string>) || {}),
  });

export default API_BASE_URL;
