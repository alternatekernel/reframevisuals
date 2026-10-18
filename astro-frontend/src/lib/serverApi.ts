export const API_BASE: string = (import.meta.env.API_BASE as string) || 'https://reframevisuals.com/api';

export async function apiGet<T = any>(path: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
