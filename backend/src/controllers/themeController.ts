import { Response } from 'express';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth';

// Get theme settings (public endpoint)
export const getTheme = async (req: AuthRequest, res: Response) => {
  try {
    let theme;
    
    if (req.user) {
      theme = await prisma.themeSetting.findUnique({
        where: { userId: req.user.id },
      });
    }

    // If no user-specific theme found, return defaults directly
    const defaults = {
      fonts: { heading: 'Satoshi', body: 'Satoshi', mono: 'JetBrains Mono' },
      colors: {
        brand: '#E97451', brandHover: '#D66140', surface: '#FFFFFF', onyx: '#0A0A0B',
        categoryFoundation: '#E97451', categoryEnhancement: '#E07A5F',
        categoryRetouch: '#3D8B7A', categoryAdvanced: '#D4A843',
        ambientOrb: '#CFC2FF', chatBubbles: '#F1F1F4',
        footerDark: '#050505', accentLavender: '#F8F6FF',
      },
      typography: { baseFontSize: 16, headingScale: 1.25, lineHeight: 1.6, letterSpacing: -0.02 },
      radius: { sm: 8, md: 16, lg: 32, xl: 64 },
    };

    if (!theme) {
      return res.json({ success: true, data: defaults });
    }

    // Transform flat database structure to nested ThemeSettings format
    const themeSettings = {
      fonts: {
        heading: theme.heading,
        body: theme.body,
        mono: theme.mono,
      },
      colors: {
        brand: theme.brand,
        brandHover: theme.brandHover,
        surface: theme.surface,
        onyx: theme.onyx,
        categoryFoundation: theme.categoryFoundation,
        categoryEnhancement: theme.categoryEnhancement,
        categoryRetouch: theme.categoryRetouch,
        categoryAdvanced: theme.categoryAdvanced,
        ambientOrb: theme.ambientOrb,
        chatBubbles: theme.chatBubbles,
        footerDark: theme.footerDark,
        accentLavender: theme.accentLavender,
      },
      typography: {
        baseFontSize: theme.baseFontSize,
        headingScale: theme.headingScale,
        lineHeight: theme.lineHeight,
        letterSpacing: theme.letterSpacing,
      },
      radius: {
        sm: theme.radiusSm,
        md: theme.radiusMd,
        lg: theme.radiusLg,
        xl: theme.radiusXl,
      },
    };

    return res.json({ success: true, data: themeSettings });
  } catch (error: any) {
    console.error('Get theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get theme',
      error: error.message,
    });
  }
};

// Update theme settings
export const updateTheme = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const themeData: any = req.body;

    // Transform nested ThemeSettings structure to flat database format
    const flatThemeData: any = {
      heading: themeData.fonts?.heading,
      body: themeData.fonts?.body,
      mono: themeData.fonts?.mono,
      brand: themeData.colors?.brand,
      brandHover: themeData.colors?.brandHover,
      surface: themeData.colors?.surface,
      onyx: themeData.colors?.onyx,
      categoryFoundation: themeData.colors?.categoryFoundation,
      categoryEnhancement: themeData.colors?.categoryEnhancement,
      categoryRetouch: themeData.colors?.categoryRetouch,
      categoryAdvanced: themeData.colors?.categoryAdvanced,
      ambientOrb: themeData.colors?.ambientOrb,
      chatBubbles: themeData.colors?.chatBubbles,
      footerDark: themeData.colors?.footerDark,
      accentLavender: themeData.colors?.accentLavender,
      baseFontSize: themeData.typography?.baseFontSize,
      headingScale: themeData.typography?.headingScale,
      lineHeight: themeData.typography?.lineHeight,
      letterSpacing: themeData.typography?.letterSpacing,
      radiusSm: themeData.radius?.sm,
      radiusMd: themeData.radius?.md,
      radiusLg: themeData.radius?.lg,
      radiusXl: themeData.radius?.xl,
    };

    // Remove undefined values
    Object.keys(flatThemeData).forEach(key => {
      if (flatThemeData[key] === undefined) delete flatThemeData[key];
    });

    const theme = await prisma.themeSetting.upsert({
      where: {
        userId: req.user.id,
      },
      update: flatThemeData,
      create: {
        userId: req.user.id,
        ...flatThemeData,
      },
    });

    return res.json({
      success: true,
      message: 'Theme updated successfully',
      data: theme,
    });
  } catch (error: any) {
    console.error('Update theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update theme',
      error: error.message,
    });
  }
};

// Reset theme to defaults
export const resetTheme = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    await prisma.themeSetting.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    const theme = await prisma.themeSetting.create({
      data: {
        userId: req.user.id,
      },
    });

    return res.json({
      success: true,
      message: 'Theme reset to defaults',
      data: theme,
    });
  } catch (error: any) {
    console.error('Reset theme error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset theme',
      error: error.message,
    });
  }
};
