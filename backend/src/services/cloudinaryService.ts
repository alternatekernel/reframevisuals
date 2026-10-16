import axios from 'axios';
import crypto from 'crypto';

// Cloud name already used for static brand/blog assets across the app.
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dnmj4altq';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'reframe/cms';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  url?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: string;
}

export interface CloudinaryDeleteResult {
  success: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

/**
 * Build a signed signature for the Cloudinary REST API.
 * Params are sorted alphabetically, joined as key=value&..., then the API
 * secret is appended and the whole string is SHA-1 hashed.
 */
function signParams(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHash('sha1')
    .update(toSign + CLOUDINARY_API_SECRET)
    .digest('hex');
}

// ─────────────────────────────────────────────────────────────
// Upload / Delete
// ─────────────────────────────────────────────────────────────

/**
 * Upload an image buffer to Cloudinary via a signed REST request.
 * The buffer is sent as a base64 data URI in the `file` field.
 */
export async function uploadImage(
  buffer: Buffer,
  mimetype: string,
  opts: { folder?: string } = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    return { success: false, error: 'Cloudinary is not configured (missing API key/secret)' };
  }

  const folder = opts.folder || CLOUDINARY_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000);

  // Only params sent to the API (besides file/api_key/signature) are signed.
  const signature = signParams({ folder, timestamp });

  const form = new URLSearchParams();
  form.append('file', `data:${mimetype};base64,${buffer.toString('base64')}`);
  form.append('api_key', CLOUDINARY_API_KEY as string);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  try {
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      form,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return {
      success: true,
      publicId: data.public_id,
      url: data.secure_url,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  } catch (error: any) {
    const message = error?.response?.data?.error?.message || error?.message || 'Upload failed';
    return { success: false, error: message };
  }
}

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export async function deleteImage(publicId: string): Promise<CloudinaryDeleteResult> {
  if (!isCloudinaryConfigured()) {
    return { success: false, error: 'Cloudinary is not configured (missing API key/secret)' };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp });

  const form = new URLSearchParams();
  form.append('public_id', publicId);
  form.append('api_key', CLOUDINARY_API_KEY as string);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);

  try {
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      form,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    if (data.result !== 'ok' && data.result !== 'not found') {
      return { success: false, error: `Unexpected result: ${data.result}` };
    }
    return { success: true };
  } catch (error: any) {
    const message = error?.response?.data?.error?.message || error?.message || 'Delete failed';
    return { success: false, error: message };
  }
}
