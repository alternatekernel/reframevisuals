/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand, #7C3AED)',
          hover:   'var(--brand-hover, #6D28D9)',
        },
        onyx:        'var(--onyx, #0A0A0B)',
        'soft-black': 'var(--soft-black, #1F1F1F)',
        surface:     'var(--surface, #FFFFFF)',
        // Semantic aliases (map to CSS tokens)
        'text-primary':    'var(--color-text-primary)',
        'text-secondary':  'var(--color-text-secondary)',
        'text-muted':      'var(--color-text-muted)',
        'bg-primary':      'var(--color-bg-primary)',
        'bg-secondary':    'var(--color-bg-secondary)',
        'border-light':    'var(--color-border-light)',
        'border-subtle':   'var(--color-border-subtle)',
        // Service category colors
        'cat-foundation':  'var(--cat-foundation)',
        'cat-enhancement': 'var(--cat-enhancement)',
        'cat-retouch':     'var(--cat-retouch)',
        'cat-advanced':    'var(--cat-advanced)',
      },
      fontFamily: {
        heading: [
          'Space Grotesk Variable',
          'Space Grotesk',
          'Space Grotesk Fallback',
          'system-ui',
          'sans-serif',
        ],
        body: [
          'Satoshi',
          'Satoshi Fallback',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'caption':    ['var(--text-caption)',   { lineHeight: '1.4' }],
        'body-sm':    ['var(--text-body-sm)',   { lineHeight: '1.5' }],
        'body':       ['var(--text-body)',      { lineHeight: '1.6' }],
        'body-lg':    ['var(--text-body-lg)',   { lineHeight: '1.5' }],
        'heading-4':  ['var(--text-heading-4)', { lineHeight: '1.2' }],
        'heading-3':  ['var(--text-heading-3)', { lineHeight: '1.25' }],
        'heading-2':  ['var(--text-heading-2)', { lineHeight: '1.3' }],
        'heading-1':  ['var(--text-heading-1)', { lineHeight: '1.1' }],
        'hero':       ['var(--text-hero)',      { lineHeight: '1.05' }],
      },
      borderRadius: {
        'card':    'var(--radius-card)',
        'card-sm': 'var(--radius-card-sm)',
        'pill':    'var(--radius-pill)',
        'lg':      'var(--radius-lg)',
        'md':      'var(--radius-md)',
        'sm':      'var(--radius-sm)',
      },
      boxShadow: {
        'resting': 'var(--shadow-resting)',
        'card':    'var(--shadow-card)',
        'hover':   'var(--shadow-hover)',
        'hero':    'var(--shadow-hero)',
        'lg':      'var(--shadow-lg)',
        'btn':     'var(--shadow-btn)',
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        'short': { raw: '(max-height: 860px)' },
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '200ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'enter':  'cubic-bezier(0.0, 0, 0.2, 1)',
        'change': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      animation: {
        'marquee':      'marquee 60s linear infinite',
        'pulse-slow':   'pulse-slow 3s ease-in-out infinite',
        'spin-slow':    'spin 6s linear infinite',
        'shimmer':      'shimmer 2.5s ease-in-out infinite',
        'fade-slide-up': 'fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down':   'slide-down 120ms ease-in both',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%':      { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%':      { transform: 'translateX(-150%)' },
          '50%, 100%': { transform: 'translateX(150%)' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
