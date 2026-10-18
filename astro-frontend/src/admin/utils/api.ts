/**
 * System-wide API configuration for the Reframe Admin Dashboard.
 * Centrally manages network vectors and operational signal routing.
 */

// Deployment signal: checks for production environment

// Target matrix base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

/**
 * Common headers for all administrative transmissions.
 */
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-System-Origin': 'REFRAME_ADMIN_v4',
};

/**
 * Standard fetch wrapper for administrative modules.
 * Ensures consistent error handling and state reporting.
 */
export async function adminFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Read the admin JWT token from localStorage
  const token = localStorage.getItem('admin_token');
  const authHeader: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      ...API_HEADERS,
      ...authHeader,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.message || errorBody?.error?.message || errorBody?.error || `Request failed with ${response.status}`;
    throw new Error(`${message} (${response.status} at ${endpoint})`);
  }

  return response.json();
}
