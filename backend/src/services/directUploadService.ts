// Validates files the browser already uploaded straight to Dropbox (see /portal/upload/init).
// The public free-trial / pilot-batch forms send these descriptors instead of the raw files.
import { isGuestIdFormat } from '../middleware/portalMiddleware';
import { uploadFolderFor } from './dropboxService';

export interface DirectUpload {
  url: string;
  path: string;
  filename: string;
}

/** Returns the validated descriptors, or null when the field is absent / malformed. */
export function parseDirectUploads(raw: unknown, guestId: unknown, max = 25): DirectUpload[] | null {
  if (!isGuestIdFormat(guestId)) return null;
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try { list = JSON.parse(raw); } catch { return null; }
  }
  if (!Array.isArray(list) || list.length === 0 || list.length > max) return null;

  const prefix = `${uploadFolderFor({ guestId }).toLowerCase()}/`;
  const out: DirectUpload[] = [];
  for (const item of list) {
    const { url, path, filename } = (item || {}) as Record<string, unknown>;
    if (typeof url !== 'string' || typeof path !== 'string' || typeof filename !== 'string') return null;
    if (!url.startsWith('https://') || !path.toLowerCase().startsWith(prefix) || path.includes('..')) return null;
    out.push({ url, path, filename: filename.slice(0, 255) });
  }
  return out;
}
