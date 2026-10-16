/**
 * Reframe Visuals - Design System Tokens
 * Single source of truth for colors, typography, spacing, elevations, radii, and motion.
 * Serves all mother components and cascades to child components across the platform.
 */

export const designTokens = {
  // Brand identity & core semantic palette
  colors: {
    brand: {
      primary: 'var(--brand, #E97451)',
      hover: 'var(--brand-hover, #D66140)',
      rgb: '233, 116, 81',
      subtle: 'rgba(233, 116, 81, 0.08)',
      muted: 'rgba(233, 116, 81, 0.16)',
    },
    neutral: {
      black: '#0A0A0B',
      softBlack: '#171717',
      onyx: '#131416',
      surface: 'var(--surface, #FFFFFF)',
      surfaceSecondary: 'var(--color-bg-secondary, #F8F9FD)',
      surfaceTertiary: '#F1F2F6',
      borderSubtle: 'rgba(0, 0, 0, 0.06)',
      borderLight: 'rgba(0, 0, 0, 0.10)',
      borderMedium: 'rgba(0, 0, 0, 0.18)',
      borderDark: 'rgba(0, 0, 0, 0.35)',
    },
    text: {
      primary: 'var(--color-text-primary, #0A0A0B)',
      secondary: 'var(--color-text-secondary, #666666)',
      muted: 'var(--color-text-muted, #8A8A8E)',
      inverted: '#FFFFFF',
      invertedMuted: 'rgba(255, 255, 255, 0.65)',
    },
    // Core Service Category Accents (Used for service chips, workflows, pricing tags)
    categories: {
      foundation: {
        color: '#EA580C',
        bg: 'rgba(234, 88, 12, 0.08)',
        border: 'rgba(234, 88, 12, 0.20)',
        label: 'Foundation',
      },
      enhancement: {
        color: '#0284C7',
        bg: 'rgba(2, 132, 199, 0.08)',
        border: 'rgba(2, 132, 199, 0.20)',
        label: 'Enhancement',
      },
      retouch: {
        color: '#16A34A',
        bg: 'rgba(22, 163, 74, 0.08)',
        border: 'rgba(22, 163, 74, 0.20)',
        label: 'Retouch',
      },
      advanced: {
        color: '#7C3AED',
        bg: 'rgba(124, 58, 237, 0.08)',
        border: 'rgba(124, 58, 237, 0.20)',
        label: 'Advanced',
      },
    },
    // Semantic feedback states
    semantic: {
      success: {
        main: '#16A34A',
        light: '#DCFCE7',
        text: '#14532D',
        border: 'rgba(22, 163, 74, 0.25)',
      },
      warning: {
        main: '#D97706',
        light: '#FEF3C7',
        text: '#78350F',
        border: 'rgba(217, 119, 6, 0.25)',
      },
      error: {
        main: '#DC2626',
        light: '#FEE2E2',
        text: '#7F1D1D',
        border: 'rgba(220, 38, 38, 0.25)',
      },
      info: {
        main: '#2563EB',
        light: '#DBEAFE',
        text: '#1E3A8A',
        border: 'rgba(37, 99, 235, 0.25)',
      },
    },
  },

  // Typography scale & font stacks
  typography: {
    fonts: {
      heading: "var(--font-heading, 'Space Grotesk', -apple-system, sans-serif)",
      body: "var(--font-body, 'Satoshi', -apple-system, sans-serif)",
      mono: "var(--font-mono, 'JetBrains Mono', monospace)",
    },
    scales: {
      hero: { size: 'clamp(2.5rem, 6vw, 4.25rem)', lineHeight: '1.04', tracking: '-0.06em', weight: '700' },
      displayLg: { size: 'clamp(2rem, 4.5vw, 3.5rem)', lineHeight: '1.08', tracking: '-0.05em', weight: '700' },
      displayMd: { size: 'clamp(1.75rem, 3.5vw, 2.75rem)', lineHeight: '1.12', tracking: '-0.04em', weight: '600' },
      h1: { size: '2.25rem', lineHeight: '1.15', tracking: '-0.035em', weight: '600' },
      h2: { size: '1.75rem', lineHeight: '1.2', tracking: '-0.03em', weight: '600' },
      h3: { size: '1.375rem', lineHeight: '1.25', tracking: '-0.025em', weight: '600' },
      h4: { size: '1.125rem', lineHeight: '1.3', tracking: '-0.02em', weight: '600' },
      bodyLg: { size: '1.125rem', lineHeight: '1.5', tracking: '-0.01em', weight: '400' },
      body: { size: '1rem', lineHeight: '1.6', tracking: '0', weight: '400' },
      bodySm: { size: '0.875rem', lineHeight: '1.5', tracking: '0', weight: '400' },
      caption: { size: '0.75rem', lineHeight: '1.4', tracking: '0.01em', weight: '500' },
      eyebrow: { size: '0.6875rem', lineHeight: '1.3', tracking: '0.16em', weight: '800' },
      micro: { size: '0.625rem', lineHeight: '1.2', tracking: '0.05em', weight: '600' },
    },
  },

  // 4px / 8px Spatial Grid
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Border Radii Scale
  radii: {
    none: '0px',
    sm: 'var(--radius-sm, 6px)',
    md: 'var(--radius-md, 10px)',
    lg: 'var(--radius-lg, 16px)',
    xl: 'var(--radius-xl, 24px)',
    '2xl': '32px',
    full: '9999px',
  },

  // Standard Elevations & Box Shadows
  shadows: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
    standard: '0 8px 24px rgba(0, 0, 0, 0.05)',
    showcase: '0 16px 40px rgba(0, 0, 0, 0.08)',
    conversion: '0 24px 64px rgba(15, 23, 42, 0.12)',
    insetGlass: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 8px 24px rgba(0, 0, 0, 0.06)',
    glowBrand: '0 0 28px -4px rgba(var(--brand-rgb, 233, 116, 81), 0.35)',
  },

  // Motion Transitions & Timings
  motion: {
    duration: {
      fast: '120ms',
      base: '200ms',
      slow: '350ms',
    },
    easing: {
      enter: 'cubic-bezier(0.0, 0, 0.2, 1)',
      change: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },

  // Layout container constraints
  layout: {
    contentShell: 'max-w-[1024px] mx-auto w-full px-5 sm:px-6',
    compactShell: 'max-w-[1280px] mx-auto w-full px-5 sm:px-6 lg:px-8',
    wideShell: 'max-w-[1600px] mx-auto w-full px-5 sm:px-6 lg:px-10',
  },
} as const;

export type DesignTokens = typeof designTokens;
