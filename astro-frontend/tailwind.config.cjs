const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{astro,html}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand, #0A0A0B)',
          hover: 'var(--brand-hover, #1F1F1F)',
          rgb: '233, 116, 81',
        },
        // "Ink" token used across widgets/buttons (supports Tailwind opacity modifiers like /10)
        'brand-ink': 'rgb(var(--brand-ink-rgb, 10 10 11) / <alpha-value>)',
        onyx: 'var(--onyx, #0A0A0B)',
        'soft-black': 'var(--soft-black, #1F1F1F)',
        surface: 'var(--surface, #F8F9FD)',
        // Semantic text color scale
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-subtle': 'var(--color-text-subtle)',
        'text-faint': 'var(--color-text-faint)',
        'text-placeholder': 'var(--color-text-placeholder)',
        // Semantic surface tokens
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-soft': 'var(--color-bg-soft)',
        // Interaction
        'focus': 'var(--color-focus, #3b82f6)',
        // Semantic state colors (wire up designTokens.colors.semantic.*)
        'semantic-error': {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          text: '#7F1D1D',
          border: 'rgba(220, 38, 38, 0.25)',
        },
        'semantic-success': {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          text: '#14532D',
          border: 'rgba(22, 163, 74, 0.25)',
        },
        'semantic-warning': {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          text: '#78350F',
          border: 'rgba(217, 119, 6, 0.25)',
        },
        'semantic-info': {
          DEFAULT: '#2563EB',
          light: '#DBEAFE',
          text: '#1E3A8A',
          border: 'rgba(37, 99, 235, 0.25)',
        },
        // Design system surface tokens — must match dashboard-primitives.tsx usage
        'borderSubtle': 'rgba(0,0,0,0.12)',
        'borderLight': 'rgba(0,0,0,0.18)',
        'surfaceMuted': '#F0F0F0',
        // Notion-style Admin colors
        'notion': {
          DEFAULT: '#37352F',
          muted: '#666666', // Improved from #9B9A97 for contrast
          border: '#EDECE9',
          hover: '#F7F6F3',
          active: '#EFEFEF',
          sidebar: '#F7F6F3',
          link: '#1B73D1',
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Space Grotesk', 'Space Grotesk Fallback', 'Inter', 'Inter Fallback', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['var(--font-body)', 'Satoshi', 'Satoshi Fallback', 'Inter', 'Inter Fallback', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // UI widget scale (panel chrome, sidebar, badge labels)
        'nano': ['var(--text-nano)', { lineHeight: '1.3' }],    /* 9px */
        'micro': ['var(--text-micro)', { lineHeight: '1.3' }],  /* 10px */
        '11': ['var(--text-11, var(--text-micro))', { lineHeight: '1.3' }],   /* 11px */
        '12': ['var(--text-12)', { lineHeight: '1.4' }],        /* 12px */
        '13': ['var(--text-13, var(--text-caption))', { lineHeight: '1.4' }], /* 13px */
        '14': ['var(--text-14)', { lineHeight: '1.4' }],        /* 14px */
        '15': ['var(--text-15, var(--text-body-sm))', { lineHeight: '1.5' }], /* 15px */
        '20': ['var(--text-20, var(--text-body-lg))', { lineHeight: '1.5' }], /* 20px */
        // Public site tokens
        'caption': ['var(--text-caption)', { lineHeight: '1.4' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: '1.5' }],
        'body': ['var(--text-body)', { lineHeight: '1.6' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: '1.5' }],
        'heading-4': ['var(--text-heading-4)', { lineHeight: '1.2' }],
        'heading-3': ['var(--text-heading-3)', { lineHeight: '1.25' }],
        'heading-2': ['var(--text-heading-2)', { lineHeight: '1.3' }],
        'heading-1': ['var(--text-heading-1)', { lineHeight: '1.1' }],
        'hero': ['var(--text-hero)', { lineHeight: '1.05' }],
        // Admin/Notion tokens (Converted to rem)
        'admin-xs': ['0.6875rem', { lineHeight: '1.4' }],   /* 11px */
        'admin-sm': ['0.75rem', { lineHeight: '1.5' }],     /* 12px */
        'admin-base': ['0.8125rem', { lineHeight: '1.5' }], /* 13px */
        'admin-md': ['0.875rem', { lineHeight: '1.4' }],    /* 14px */
        'admin-lg': ['1rem', { lineHeight: '1.3' }],        /* 16px */
        'admin-xl': ['1.125rem', { lineHeight: '1.3' }],    /* 18px */
        'admin-2xl': ['1.5rem', { lineHeight: '1.2' }],     /* 24px */
        'admin-3xl': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], /* 32px */
      },
      spacing: {
        'spacing-xs': 'var(--spacing-xs)',
        'spacing-sm': 'var(--spacing-sm)',
        'spacing-md': 'var(--spacing-md)',
        'spacing-lg': 'var(--spacing-lg)',
        'spacing-xl': 'var(--spacing-xl)',
        'spacing-2xl': 'var(--spacing-2xl)',
        'spacing-3xl': 'var(--spacing-3xl)',
      },
      fontWeight: {
        thin: '300',
        light: '400',
        normal: '500',
        medium: '600',
        semibold: '700',
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        'zoom': {'min': '1800px', 'max': '2600px'},
        // Short viewports: laptops with OS display scaling where the CSS
        // viewport height drops below ~860px. Declared last so it wins over
        // width-based variants in the cascade.
        'short': { raw: '(max-height: 860px)' },
      },
      // ── Motion duration scale ──────────────────────────────────────
      // fast  (120ms) — micro-feedback: button press, toggle, checkbox
      // base  (200ms) — standard UI: hover, focus, color changes
      // slow  (350ms) — structural: modal open, drawer, step transitions
      borderRadius: {
        'token-sm': 'var(--radius-sm, 8px)',
        'token-md': 'var(--radius-md, 16px)',
        'token-lg': 'var(--radius-lg, 32px)',
        'token-xl': 'var(--radius-xl, 64px)',
        'sm-token': 'var(--radius-sm, 8px)',
        'md-token': 'var(--radius-md, 16px)',
        'lg-token': 'var(--radius-lg, 32px)',
        'xl-token': 'var(--radius-xl, 64px)',
      },
      boxShadow: {
        'token-subtle': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
        'token-standard': '0 8px 24px rgba(0, 0, 0, 0.09)',
        'token-showcase': '0 16px 40px rgba(0, 0, 0, 0.13)',
        'token-conversion': '0 24px 64px rgba(15, 23, 42, 0.18)',
        'token-inset-glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'token-glow-brand': '0 0 28px -4px rgba(var(--brand-rgb, 233, 116, 81), 0.35)',
        'token-focus': '0 0 0 2px rgba(59, 130, 246, 0.88)',
        subtle: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
        standard: '0 8px 24px rgba(0, 0, 0, 0.09)',
        showcase: '0 16px 40px rgba(0, 0, 0, 0.13)',
        conversion: '0 24px 64px rgba(15, 23, 42, 0.18)',
        'inset-glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'glow-brand': '0 0 28px -4px rgba(var(--brand-rgb, 233, 116, 81), 0.35)',
        focus: '0 0 0 2px rgba(59, 130, 246, 0.88)',
        'shadow-focus': '0 0 0 2px rgba(59, 130, 246, 0.88)',
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '200ms',
        'slow': '350ms',
      },
      // ── Motion easing vocabulary ───────────────────────────────────
      // enter  — things entering the screen (decelerate)
      // change — state changes: hover, focus, toggle
      transitionTimingFunction: {
        'enter': 'cubic-bezier(0.0, 0, 0.2, 1)',
        'change': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      animation: {
        'marquee': 'marquee 60s linear infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'pulse-slower': 'pulse-slow 4s ease-in-out infinite 0.5s',
        'spin-slow': 'spin 6s linear infinite',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'focal-pulse': 'focal-pulse 3s ease-in-out infinite',
        'glass-arrow-pulse': 'glass-arrow-pulse 3s ease-in-out infinite',
        'slide-down': 'slide-down 120ms ease-in both',
        'fade-slide-up': 'fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },
        'focal-pulse': {
          '0%, 100%': { boxShadow: '0 4px 16px -4px rgba(var(--brand-rgb), 0.2)' },
          '50%': { boxShadow: '0 6px 20px -4px rgba(var(--brand-rgb), 0.3)' },
        },
        'glass-arrow-pulse': {
          '0%, 100%': { boxShadow: '0 4px 16px -2px rgba(var(--brand-rgb), 0.5)' },
          '50%': { boxShadow: '0 4px 24px 0px rgba(var(--brand-rgb), 0.7)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-150%)' },
          '50%, 100%': { transform: 'translateX(150%)' },
        }
      }
    },
  },
  plugins: [addVariablesForColors],
}

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

