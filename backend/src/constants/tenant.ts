export const TENANT_PLATFORM = 'platform';

export const TENANT_CONSTANTS = {
  PLATFORM: TENANT_PLATFORM,
  DEFAULT_TIER: 'startup',
  DEFAULT_STATUS: 'active',
} as const;

export const API_CONSTANTS = {
  DEFAULT_PORT: 3001,
  CACHE_TTL: 30000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const FILE_UPLOAD_CONSTANTS = {
  DEFAULT_MAX_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
  ],
} as const;