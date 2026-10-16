const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
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
        // Semantic colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
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

