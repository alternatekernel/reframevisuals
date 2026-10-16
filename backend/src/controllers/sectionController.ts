import { Response } from 'express';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth';

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

    // Parse content JSON strings
    const parsedSections = sections.map(section => ({
      ...section,
      content: JSON.parse(section.content as string) || {},
    }));

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

    return res.json({
      success: true,
      data: {
        ...section,
        content: JSON.parse(section.content as string) || {},
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

    const section = await prisma.section.upsert({
      where: {
        sectionId_userId: {
          sectionId,
          userId: req.user.id,
        },
      },
      update: {
        ...(label && { label }),
        content: JSON.stringify(content),
      },
      create: {
        sectionId,
        label: label || sectionId,
        content: JSON.stringify(content),
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
