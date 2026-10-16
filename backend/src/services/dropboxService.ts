import axios from 'axios';
import { Readable } from 'stream';

const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
const DROPBOX_REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const DROPBOX_APP_KEY = process.env.DROPBOX_APP_KEY;
const DROPBOX_APP_SECRET = process.env.DROPBOX_APP_SECRET;
const DROPBOX_UPLOAD_FOLDER = process.env.DROPBOX_UPLOAD_FOLDER || '/Reframe Uploads';

// Never pre-cache the env-provided access token — it may be stale after a container
// restart. The first call will proactively refresh (when credentials are available)
// or fall back to the raw DROPBOX_ACCESS_TOKEN env var.
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DropboxUploadOptions {
  /** Guest session UUID from localStorage e.g. 'a3f9c2...' */
  guestId?: string;
  /** Registered customer code e.g. 'CLT042' */
  customerCode?: string;
  /** Reserved order code e.g. 'JOB031' */
  orderCode?: string;
  /** Upload category so support files stay in their own subfolder */
  uploadCategory?: 'original' | 'support';
}

export interface DropboxUploadResult {
  success: boolean;
  url?: string;
  /** Full Dropbox path to the file */
  path?: string;
  /** Parent folder — used for cleanup on order cancellation */
  folderPath?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

function hasRefreshTokenConfig(): boolean {
  return Boolean(DROPBOX_REFRESH_TOKEN && DROPBOX_APP_KEY && DROPBOX_APP_SECRET);
}

async function refreshDropboxAccessToken(): Promise<string> {
  if (!hasRefreshTokenConfig()) {
    throw new Error('Dropbox auth not configured. Set DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, and DROPBOX_APP_SECRET in production.');
  }

  const credentials = Buffer.from(`${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: DROPBOX_REFRESH_TOKEN as string,
  });

  const response = await axios.post('https://api.dropboxapi.com/oauth2/token', body.toString(), {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const token = response.data?.access_token;
  if (!token) throw new Error('Dropbox refresh did not return an access token.');

  const expiresInMs = Number(response.data?.expires_in || 14400) * 1000;
  cachedAccessToken = {
    token,
    // Refresh one minute before expiry.
    expiresAt: Date.now() + expiresInMs - 60 * 1000,
  };

  return token;
}

async function getDropboxAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  if (hasRefreshTokenConfig()) {
    return refreshDropboxAccessToken();
  }

  if (DROPBOX_ACCESS_TOKEN) {
    return DROPBOX_ACCESS_TOKEN;
  }

  throw new Error('Dropbox auth not configured. Set DROPBOX_REFRESH_TOKEN + app credentials, or a temporary DROPBOX_ACCESS_TOKEN.');
}

function isExpiredAccessTokenError(error: any): boolean {
  const summary = String(error.response?.data?.error_summary || error.response?.data?.error?.['.tag'] || '');
  return error.response?.status === 401 || summary.includes('expired_access_token') || summary.includes('invalid_access_token');
}

async function withDropboxToken<T>(operation: (token: string) => Promise<T>): Promise<T> {
  try {
    return await operation(await getDropboxAccessToken());
  } catch (error: any) {
    if (isExpiredAccessTokenError(error) && hasRefreshTokenConfig()) {
      cachedAccessToken = null;
      return operation(await refreshDropboxAccessToken());
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
function buildFolderPath(options: DropboxUploadOptions): string {
  const supportSuffix = options.uploadCategory === 'support' ? '/support-files' : '';
  if (options.customerCode && options.orderCode) {
    return `${DROPBOX_UPLOAD_FOLDER}/clients/${options.customerCode}/${options.orderCode}${supportSuffix}`;
  }
  if (options.customerCode) {
    return `${DROPBOX_UPLOAD_FOLDER}/clients/${options.customerCode}/unassigned${supportSuffix}`;
  }
  const shortId = (options.guestId || 'anon').replace(/-/g, '').slice(-6);
  return `${DROPBOX_UPLOAD_FOLDER}/guests/guest${shortId}${supportSuffix}`;
}

/** Returns a shared Dropbox link for the given path, handling existing-link edge case */
async function getOrCreateSharedLinkWithToken(token: string, pathLower: string, pathDisplay: string): Promise<string> {
  try {
    const res = await axios.post(
      'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
      { path: pathLower },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return res.data.url.replace('?dl=0', '?raw=1');
  } catch (err: any) {
    if (err.response?.data?.error?.['.tag'] === 'shared_link_already_exists') {
      try {
        const listRes = await axios.post(
          'https://api.dropboxapi.com/2/sharing/list_shared_links',
          { path: pathLower },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        const url = listRes.data.links[0]?.url || `https://www.dropbox.com/home${pathDisplay}?dl=0`;
        return url.replace('?dl=0', '?raw=1');
      } catch {
        return `https://www.dropbox.com/home${pathDisplay}?raw=1`;
      }
    }
    return `https://www.dropbox.com/home${pathDisplay}?raw=1`;
  }
}

async function getOrCreateSharedLink(pathLower: string, pathDisplay: string): Promise<string> {
  return withDropboxToken(token => getOrCreateSharedLinkWithToken(token, pathLower, pathDisplay));
}

/** Returns a shared Dropbox link for a folder path */
export async function getDropboxFolderLink(folderPath: string): Promise<string> {
  try {
    return await getOrCreateSharedLink(folderPath.toLowerCase(), folderPath);
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────────────────────

/**
 * Uploads a file to Dropbox under a human-readable folder structure.
 *
 * Folder hierarchy:
 *   Guests  → /Reframe Uploads/guests/guest-[6-char-id]/[YYYY-MM-DD]-[project]/
 *   Clients → /Reframe Uploads/clients/[name-slug]/[YYYY-MM-DD]-[project]/
 *
 * No file size limit — Dropbox handles large PSD / TIFF / RAW files natively.
 */
export async function uploadToDropbox(
  fileStream: Readable | Buffer,
  filename: string,
  options: DropboxUploadOptions = {}
): Promise<DropboxUploadResult> {
  try {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folderPath = buildFolderPath(options);
    const dropboxPath = `${folderPath}/${Date.now()}-${safeFilename}`;

    const response = await withDropboxToken(token => axios.post(
      'https://content.dropboxapi.com/2/files/upload',
      fileStream,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: dropboxPath,
            mode: 'add',
            autorename: true,
            mute: false,
          }),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000,
      }
    ));

    const result = response.data;
    const fileUrl = await getOrCreateSharedLink(result.path_lower, result.path_display);

    return {
      success: true,
      url: fileUrl,
      path: result.path_display,
      folderPath,
    };
  } catch (error: any) {
    // FIX: Sanitize logging - avoid dumping potentially sensitive filenames/paths in full objects
    const errorMsg = error.response?.data?.error_summary || error.response?.data?.error_description || error.message;
    console.error('[Dropbox] Upload error:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Direct browser uploads: returns a short-lived Dropbox upload link so large files never pass
 * through the (size-limited) serverless function. Pair with finalizeDirectUpload().
 */
export async function createDirectUploadLink(
  filename: string,
  options: DropboxUploadOptions = {}
): Promise<{ uploadUrl: string; folderPath: string; path: string }> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folderPath = buildFolderPath(options);
  const path = `${folderPath}/${Date.now()}-${safeFilename}`;
  const response = await withDropboxToken(token => axios.post(
    'https://api.dropboxapi.com/2/files/get_temporary_upload_link',
    {
      commit_info: { path, mode: 'add', autorename: true, mute: false },
      duration: 4 * 60 * 60,
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  ));
  return { uploadUrl: response.data.link, folderPath, path };
}

/**
 * Confirms the file really landed in Dropbox (the temporary-link response carries no path)
 * and builds its shared link. Throws if the file is missing.
 */
export async function finalizeDirectUpload(path: string): Promise<{ url: string; path: string }> {
  const meta = await withDropboxToken(token => axios.post(
    'https://api.dropboxapi.com/2/files/get_metadata',
    { path },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  ));
  const url = await getOrCreateSharedLink(meta.data.path_lower, meta.data.path_display);
  return { url, path: meta.data.path_display };
}

/** Folder prefix a given identity may write to — used to validate /complete requests. */
export function uploadFolderFor(options: DropboxUploadOptions): string {
  return buildFolderPath(options);
}

// ─────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────

/**
 * Deletes a single file from Dropbox by its full path.
 * Used when an order is cancelled to remove already-uploaded assets.
 */
export async function deleteFromDropbox(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    await withDropboxToken(token => axios.post(
      'https://api.dropboxapi.com/2/files/delete_v2',
      { path },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ));
    return { success: true };
  } catch (error: any) {
    console.error('[Dropbox] Delete error:', error.response?.data?.error_summary || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes an entire project folder from Dropbox.
 * Call this when an order is cancelled before any work begins.
 *
 * @param folderPath - The `folderPath` value returned from `uploadToDropbox`
 */
export async function cleanupDropboxFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
  return deleteFromDropbox(folderPath);
}

/**
 * Purges guest upload folders older than `olderThanDays` days.
 * Run this as a scheduled admin task (weekly cron, or manually via API).
 *
 * @param olderThanDays - Default 7 days
 */
export async function purgeOldGuestFolders(olderThanDays = 7): Promise<{ purged: number; errors: string[] }> {
  const errors: string[] = [];
  let purged = 0;

  try {
    const listRes = await withDropboxToken(token => axios.post(
      'https://api.dropboxapi.com/2/files/list_folder',
      { path: `${DROPBOX_UPLOAD_FOLDER}/guests` },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ));

    const guestFolders: any[] = listRes.data.entries || [];
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    for (const folder of guestFolders) {
      if (folder['.tag'] !== 'folder') continue;

      // List sub-folders (date-project folders) inside each guest folder
      try {
        const subRes = await withDropboxToken(token => axios.post(
          'https://api.dropboxapi.com/2/files/list_folder',
          { path: folder.path_lower },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        ));

        const subFolders: any[] = subRes.data.entries || [];
        let guestHasRecentFiles = false;

        for (const sub of subFolders) {
          const modifiedAt = new Date(sub.server_modified || sub.client_modified || 0).getTime();
          if (modifiedAt > cutoff) {
            guestHasRecentFiles = true;
            break;
          }
        }

        // Only delete the entire guest folder if ALL sub-folders are old
        if (!guestHasRecentFiles) {
          const del = await deleteFromDropbox(folder.path_lower);
          if (del.success) {
            purged++;
            console.log(`[Dropbox] Purged old guest folder: ${folder.path_display}`);
          } else {
            errors.push(`Failed to purge ${folder.path_display}: ${del.error}`);
          }
        }
      } catch (subErr: any) {
        // Empty guest folder — safe to delete
        if (subErr.response?.status === 409) {
          const del = await deleteFromDropbox(folder.path_lower);
          if (del.success) purged++;
        } else {
          errors.push(`Error listing ${folder.path_display}: ${subErr.message}`);
        }
      }
    }
  } catch (err: any) {
    // guests/ folder doesn't exist yet — that's fine
    if (err.response?.status === 409) return { purged: 0, errors: [] };
    errors.push(err.message);
  }

  return { purged, errors };
}

/**
 * Lists files in a specific Dropbox folder path.
 */
export async function listDropboxFiles(folderPath: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const response = await withDropboxToken(token => axios.post(
      'https://api.dropboxapi.com/2/files/list_folder',
      { path: folderPath },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    ));
    return { success: true, files: response.data.entries };
  } catch (error: any) {
    if (error.response?.status === 409) return { success: true, files: [] };
    return { success: false, error: error.message };
  }
}

/**
 * Downloads a file from Dropbox and returns a readable stream.
 */
export async function downloadFromDropbox(path: string): Promise<Readable> {
  const response = await withDropboxToken(token => axios.post(
    'https://content.dropboxapi.com/2/files/download',
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify({ path }),
      },
      responseType: 'stream',
    }
  ));

  return response.data;
}
