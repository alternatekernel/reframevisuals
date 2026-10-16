import { Router } from 'express';
import { prisma } from '../database';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/images/:id/versions
// Returns version history for an image
// ─────────────────────────────────────────────────────────────

router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const versions = await prisma.imageVersion.findMany({
      where: { imageId: id },
      orderBy: { version: 'desc' },
    });
    res.json({ versions });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'VERSIONS_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/images/:id/versions
// Create new version
// ─────────────────────────────────────────────────────────────

router.post('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    const { editorId, changes, fileUrl } = req.body;
    const lastVersion = await prisma.imageVersion.findFirst({
      where: { imageId: id },
      orderBy: { version: 'desc' },
    });
    const newVersion = (lastVersion?.version || 0) + 1;
    const version = await prisma.imageVersion.create({
      data: { imageId: id, version: newVersion, editorId, changes: JSON.stringify(changes), fileUrl },
    });
    res.status(201).json({ version, message: 'Version created' });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'CREATE_VERSION_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/images/:id/annotations
// Add annotation to image
// ─────────────────────────────────────────────────────────────

router.post('/:id/annotations', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, coordinates, note, authorId } = req.body;
    const annotation = await prisma.annotation.create({
      data: { imageId: id, type, coordinates: JSON.stringify(coordinates), note, authorId },
    });
    res.status(201).json({ annotation, message: 'Annotation added' });
  } catch (error: any) {
    res.status(400).json({ error: { code: 'CREATE_ANNOTATION_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/images/:id/annotations
// Get all annotations for image
// ─────────────────────────────────────────────────────────────

router.get('/:id/annotations', async (req, res) => {
  try {
    const { id } = req.params;
    const annotations = await prisma.annotation.findMany({
      where: { imageId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ annotations });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'ANNOTATIONS_ERROR', message: error.message } });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/images/:id/status
// Update image processing status
// ─────────────────────────────────────────────────────────────

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['pending', 'in_progress', 'completed', 'revision_needed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: { code: 'INVALID_IMAGE_STATUS', message: `Invalid status. Allowed: ${allowed.join(', ')}` },
      });
    }

    const image = await prisma.image.update({
      where: { id },
      data: { status },
    });

    return res.json({ success: true, data: image });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'IMAGE_STATUS_ERROR', message: error.message } });
  }
});

export default router;
