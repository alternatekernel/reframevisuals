import { Router } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/assets
// Returns all assets
// ─────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { type, category } = req.query;
    const where: any = {};
    if (type) where.type = type as string;
    if (category) where.category = category as string;

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ assets, totalCount: assets.length });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'ASSETS_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assets
// Upload new asset
// ─────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { name, type, category, url, tags } = req.body;
    const asset = await prisma.asset.create({
      data: { name, type, category, url, tags: JSON.stringify(tags || []) },
    });
    return res.status(201).json({ asset, message: 'Asset uploaded' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'UPLOAD_ASSET_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/assets/:id
// Delete asset
// ─────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.asset.delete({ where: { id } });
    return res.json({ message: 'Asset deleted' });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'DELETE_ASSET_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assets/categories
// Returns asset categories
// ─────────────────────────────────────────────────────────────

router.get('/categories', async (_req, res) => {
  try {
    const categories = [
      { id: 'backgrounds', name: 'Backgrounds', count: 24 },
      { id: 'shadows', name: 'Shadows & Reflections', count: 18 },
      { id: 'logos', name: 'Logos', count: 12 },
      { id: 'overlays', name: 'Overlays', count: 8 },
      { id: 'textures', name: 'Textures', count: 15 },
    ];
    return res.json({ categories });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CATEGORIES_ERROR', message: error.message } });
  }
});

export default router;
