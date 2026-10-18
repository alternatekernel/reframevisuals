export const getCanonicalBaseUrl = (): string => {
  const envBase = import.meta.env.VITE_CANONICAL_BASE_URL as string | undefined;

  if (envBase && envBase.trim()) {
    return envBase.replace(/\/$/, '').replace('://www.', '://');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'reframevisuals.com' || host === 'www.reframevisuals.com') {
      return window.location.origin.replace(/\/$/, '').replace('://www.', '://');
    }
  }

  return 'https://reframevisuals.com';
};

export const absoluteCanonicalUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getCanonicalBaseUrl()}${normalizedPath}`;
};
