/**
 * Calculates the volume of an order based on the precedence rule:
 * 1. If a customer provides a `customFilesLink`, the `customFilesCount` (defaulting to 1 if empty/0)
 *    must override the uploaded files count.
 * 2. If no custom files link is provided, it falls back to uploaded original/main files
 *    plus source link references. Explicit support files are excluded.
 */
export function calculateOrderVolume(orderData: {
  customFilesLink?: string | null;
  customFilesCount?: number | null;
  files: Array<{ type?: string; mimeType?: string; name?: string } | File>;
  supportFiles?: Array<{ type?: string; mimeType?: string; name?: string } | File>;
  sourceLinks?: string[] | null;
}): number {
  if (orderData.customFilesLink && orderData.customFilesLink.trim() !== '') {
    return Math.max(1, orderData.customFilesCount || 1);
  }

  const workFileCount = orderData.files.length;

  const sourceLinkCount = orderData.sourceLinks ? orderData.sourceLinks.length : 0;

  return workFileCount + sourceLinkCount;
}
