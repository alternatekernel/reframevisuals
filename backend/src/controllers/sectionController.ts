import { Response } from 'express';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth';

// Services retired from public display & pricing
const EXCLUDED_SERVICE_IDS = new Set([
  'raster-to-vector',
  'raster-vector',
  'ai-product-photography',
  'ai-product-photo',
  'ai-video-generation',
  'ai-video-gen',
  'sketch-to-reality',
  'sketch-to-image',
  'sketch-reality',
  'ai-generated-image-refinement',
  'ai-refinement',
  'ai-editing-fixing',
]);

const EXCLUDED_SERVICE_NAMES = new Set([
  'raster to vector',
  'ai product photography',
  'ai video generation',
  'sketch to image',
  'sketch to reality',
  'ai-generated image refinement',
  'ai generated image refinement',
  'ai-assisted image refinement',
  'ai refinement',
]);

export const isExcludedService = (item: any): boolean => {
  if (!item) return false;
  const id = typeof item.id === 'string' ? item.id.toLowerCase().trim() : '';
  const name = typeof item.name === 'string' ? item.name.toLowerCase().trim() : '';
  if (id && EXCLUDED_SERVICE_IDS.has(id)) return true;
  if (name && EXCLUDED_SERVICE_NAMES.has(name)) return true;
  return false;
};

const sanitizeSectionContent = (sectionId: string, content: any): any => {
  if (!content) return content;
  if (sectionId === 'services') {
    if (Array.isArray(content.items)) {
      return {
        ...content,
        items: content.items.filter((item: any) => !isExcludedService(item)),
      };
    }
    if (Array.isArray(content.services)) {
      return {
        ...content,
        services: content.services.filter((item: any) => !isExcludedService(item)),
      };
    }
  }
  return content;
};

// Get all sections
export const getAllSections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const sections = await prisma.section.findMany({
      where: userId ? { userId } : {}, // If no user, get all (or filter by a 'public' flag if you have one)
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Parse content JSON strings and strip retired services
    const parsedSections = sections.map(section => {
      const parsedContent = JSON.parse(section.content as string) || {};
      return {
        ...section,
        content: sanitizeSectionContent(section.sectionId, parsedContent),
      };
    });

    return res.json({
      success: true,
      data: parsedSections,
    });
  } catch (error: any) {
    console.error('Get all sections error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sections',
      error: error.message,
    });
  }
};

// Get section by ID
export const getSection = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user?.id;

    const section = await prisma.section.findFirst({
      where: userId 
        ? { sectionId, userId }
        : { sectionId },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    const parsedContent = JSON.parse(section.content as string) || {};

    return res.json({
      success: true,
      data: {
        ...section,
        content: sanitizeSectionContent(section.sectionId, parsedContent),
      },
    });
  } catch (error: any) {
    console.error('Get section error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get section',
      error: error.message,
    });
  }
};

// Create or update section (upsert)
export const upsertSection = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { sectionId } = req.params;
    const { label, content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const sanitized = sanitizeSectionContent(sectionId, content);
    const contentString = JSON.stringify(sanitized);

    const section = await prisma.section.upsert({
      where: {
        sectionId_userId: {
          sectionId,
          userId: req.user.id,
        },
      },
      update: {
        ...(label && { label }),
        content: contentString,
      },
      create: {
        sectionId,
        label: label || sectionId,
        content: contentString,
        userId: req.user.id,
      },
    });

    return res.json({
      success: true,
      message: 'Section saved successfully',
      data: {
        ...section,
        content: JSON.parse(section.content as string) || {},
      },
    });
  } catch (error: any) {
    console.error('Upsert section error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save section',
      error: error.message,
    });
  }
};

// Delete section
export const deleteSection = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { sectionId } = req.params;

    await prisma.section.delete({
      where: {
        sectionId_userId: {
          sectionId,
          userId: req.user.id,
        },
      },
    });

    return res.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete section error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message,
    });
  }
};
