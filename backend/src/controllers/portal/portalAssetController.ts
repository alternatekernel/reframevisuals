import { Response } from 'express';
import { prisma } from '../../database';
import archiver from 'archiver';
import { downloadFromDropbox } from '../../services/dropboxService';
import path from 'path';
import { safeError } from '../../utils/errors';

/**
 * Generates a ZIP file of all images in an order and streams it to the client.
 * Isolated by customerId for security.
 */
export const downloadJobAssets = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id;
    const selectedAssetIds = typeof req.query.assetIds === 'string'
      ? new Set(req.query.assetIds.split(',').map((assetId: string) => assetId.trim()).filter(Boolean))
      : null;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    const order = await prisma.order.findFirst({
      where: { id, customerId },
      include: { images: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const downloadableImages = selectedAssetIds
      ? order.images.filter((img: any) => selectedAssetIds.has(img.id))
      : order.images;

    const withFiles = downloadableImages.filter((img: any) => img.path);

    if (withFiles.length === 0) {
      // Nothing is stored for this order. If the team delivered through a link,
      // say so — "Failed to generate download" told the client nothing.
      if (order.deliveryLink) {
        return res.status(409).json({
          success: false,
          message: 'Your files were delivered through a link. Open the delivery link on this project page.',
          deliveryLink: order.deliveryLink,
        });
      }
      return res.status(400).json({
        success: false,
        message: 'No files are available for download on this project yet.',
      });
    }

    // Set headers for ZIP download
    const zipName = `${order.code || 'assets'}_${selectedAssetIds ? 'selected_' : ''}${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('[Archiver] Warning:', err);
      } else {
        throw err;
      }
    });

    archive.on('error', (err) => {
      console.error('[Archiver] Error:', err);
      // We can't send a 500 here because headers might have already been sent
      res.end();
    });

    // Pipe archive data to the response
    archive.pipe(res);

    // Add each image to the archive
    for (const img of withFiles) {
      try {
        const stream = await downloadFromDropbox(img.path);
        // Use the original filename or a sanitized version
        const filename = img.filename || `asset_${img.id}.jpg`;
        archive.append(stream, { name: selectedAssetIds ? `selected/${filename}` : filename });
      } catch (downloadErr: any) {
        console.error(`[Archiver] Failed to download asset ${img.id}:`, downloadErr.message);
        // Continue with other assets even if one fails
      }
    }

    // Finalize the archive (ie we are done appending files but streams have to finish packing)
    await archive.finalize();
    return res;
  } catch (error: any) {
    console.error('[PortalAsset] Download error:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: safeError(error) });
    }
    res.end();
    return res;
  }
};

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.bmp': 'image/bmp',
  '.heic': 'image/heic',
};

/**
 * Streams a single order asset straight from Dropbox.
 *
 * Assets are stored in Dropbox and the DB keeps the `?raw=1` share link. Those links
 * serve an HTML interstitial rather than image bytes, so every <img> in the portal
 * rendered as a broken thumbnail. Proxying through our own origin also means the
 * asset URLs stay behind the ownership check instead of being public share links.
 */
export const streamJobAsset = async (req: any, res: Response): Promise<any> => {
  try {
    const { id, imageId } = req.params;
    const customerId = req.customer?.id;

    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Identity required' });
    }

    const image = await prisma.image.findFirst({
      where: { id: imageId, orderId: id, order: { customerId } },
      select: { id: true, path: true, filename: true },
    });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (!image.path) {
      return res.status(404).json({ success: false, message: 'Asset has no stored file' });
    }

    const extension = path.extname(image.filename || image.path).toLowerCase();
    res.setHeader('Content-Type', MIME_BY_EXTENSION[extension] || 'application/octet-stream');
    // Private: the response is scoped to one customer's asset.
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = await downloadFromDropbox(image.path);
    stream.on('error', (streamError: any) => {
      console.error('[PortalAsset] Stream error:', streamError?.message || streamError);
      if (!res.headersSent) res.status(502).end();
      else res.end();
    });
    stream.pipe(res);
    return res;
  } catch (error: any) {
    console.error('[PortalAsset] Asset stream failed:', error?.message || error);
    if (!res.headersSent) {
      return res.status(502).json({ success: false, message: 'Asset unavailable' });
    }
    res.end();
    return res;
  }
};
