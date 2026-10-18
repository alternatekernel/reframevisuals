/**
 * Cloudinary URL helpers for display-time image optimization.
 *
 * These only rewrite *display* URLs (never upload/storage URLs) so the CDN
 * serves right-sized, auto-format, auto-quality derivatives instead of the
 * raw uploaded originals.
 */

const UPLOAD_SEGMENT = '/image/upload/';

/**
 * Injects a Cloudinary transformation segment right after `/image/upload/`.
 * No-op for non-Cloudinary URLs or URLs missing the upload segment.
 *
 * cldTransform('.../image/upload/v123/foo.jpg', 'f_auto,q_auto,w_72')
 *   -> '.../image/upload/f_auto,q_auto,w_72/v123/foo.jpg'
 */
export const cldTransform = (url: string, transform: string): string => {
  if (!url || !transform || !url.includes(UPLOAD_SEGMENT)) return url;
  return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transform}/`);
};

/**
 * Small round avatar derivative (~34-44px display size, 72px = 2x retina).
 * Face-gravity crop keeps portraits centered when squared off.
 */
export const AVATAR_TRANSFORM = 'f_auto,q_auto,w_72,h_72,c_fill,g_face';

export const cldAvatar = (url: string): string => cldTransform(url, AVATAR_TRANSFORM);
