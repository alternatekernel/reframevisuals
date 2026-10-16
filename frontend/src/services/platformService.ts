import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001/api');

export interface PlatformPage {
  id: string;
  path: string;
  title: string;
  description: string;
  icon: string | null;
  requiresAuth: boolean;
  isAdmin: boolean;
  section?: string;
}

export const fetchPlatformPages = async (): Promise<PlatformPage[]> => {
  try {
    const response = await axios.get(`${API_BASE}/platform/pages`, {
      timeout: 10000 // 10s timeout
    });
    return response.data;
  } catch (error) {
    console.error('fetchPlatformPages failed:', error);
    return [];
  }
};

export const fetchPlatformKnowledge = async () => {
  const response = await axios.get(`${API_BASE}/platform/knowledge`);
  return response.data;
};
