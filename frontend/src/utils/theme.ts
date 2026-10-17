export const cx = (...classes: (string | boolean | undefined | null)[]): string => classes.filter(Boolean).join(' ');

export const layout = {
  compactShell: "max-w-[1280px] mx-auto w-full",
  contentShell: "max-w-[1024px] mx-auto w-full",
  sectionGutter: "px-6 lg:px-12 xl:px-20",
  surfaceInset: "mx-4 lg:mx-10",
  surfaceRound: "rounded-[32px] lg:rounded-[64px]",
  sectionPadding: "py-14 sm:py-16 lg:py-24",       // Standard section: 56/64/96px
  sectionPaddingMedium: "py-10 sm:py-12 lg:py-20", // Compact section: 40/48/80px
};

// --- TYPOGRAPHY ---
export const typography = {
  // Base
  heading: "font-heading tracking-[-0.03em] leading-tight",

  // ── Display (responsive section-level headings) ──
  // Dark/hero sections, maximum impact
  displayXl: "font-heading font-bold tracking-[-0.06em] leading-[1.04] text-[32px] sm:text-[48px] lg:text-[72px]",
  // Standard landing section h2 (Stats, Differentiation, Testimonials, Pricing…)
  displayLg: "font-heading font-bold tracking-[-0.055em] leading-[1.06] text-[28px] sm:text-[42px] lg:text-[64px]",
  // Supporting sections (ReframeCS, Workflow, sub-pages…)
  displayMd: "font-heading font-semibold tracking-[-0.05em] leading-[1.08] text-[24px] sm:text-[36px] lg:text-[52px]",
  // Feature / card group headings
  displaySm: "font-heading font-semibold tracking-[-0.04em] leading-[1.1] text-[20px] sm:text-[28px] lg:text-[40px]",

  // ── In-section headings (non-responsive or mildly so) ──
  h2: "font-heading font-semibold tracking-[-0.03em] leading-[1.15] text-[20px] lg:text-[28px]",
  h3: "font-heading font-semibold tracking-[-0.025em] leading-[1.2] text-[17px] lg:text-[22px]",
  h4: "font-heading font-semibold tracking-[-0.02em] leading-[1.25] text-[15px] lg:text-[17px]",

  // ── Body ──
  bodyLg: "text-[16px] lg:text-[18px] leading-relaxed",
  body: "text-[14px] lg:text-[15px] leading-relaxed",
  bodySmall: "text-[13px] leading-relaxed",

  // ── Labels / UI ──
  eyebrow: "font-heading font-black uppercase tracking-[0.18em] text-[10px] sm:text-[11px]",
  caption: "text-[12px] leading-snug",
  micro: "text-[10px] leading-none",

  // ── Special ──
  price: "font-heading font-black tracking-[-0.05em]",

  // ── Semantic color helpers ──
  sectionTitleInk: "text-[var(--color-text-primary)]",
  sectionSubtitleMuted: "text-[var(--color-text-secondary)]",
  sectionSubtitleSoft: "text-[var(--color-text-muted)]",

  // ── Legacy aliases (in use across pricing/about/insights) ──
  label: "font-heading font-black uppercase tracking-[0.18em] text-[10px] sm:text-[11px]",
  vercelSection: "font-heading font-semibold tracking-[-0.045em] leading-[1.06] text-[28px] sm:text-[42px] lg:text-[64px]",
  vercelMono: "font-heading uppercase tracking-[0.18em] text-[11px]",
  vercelCardTitle: "font-heading font-semibold tracking-[-0.04em] text-[20px] lg:text-[24px]",
  vercelHero: "font-heading font-black tracking-[-0.07em] leading-[1.0] text-[40px] sm:text-[56px] lg:text-[88px]",
};

// --- VERCEL-INSPIRED TOKENS ---
export const tokens = {
  // Colors
  vblack: "#171717",
  vwhite: "#ffffff",
  vgray: {
    50: "#fafafa",
    100: "#ebebeb",
    400: "#808080",
    500: "#666666",
    600: "#4d4d4d",
    900: "#171717",
  },

  // Shadows (Standardized Global System)
  shadowBorder: "0 0 0 1px rgba(0,0,0,0.14)",
  shadowStandard: "0 8px 24px rgba(0,0,0,0.09)",       // Low elevation: 16px content cards
  shadowShowcase: "0 14px 40px rgba(0,0,0,0.12)",      // Medium elevation: 24px showcase/service cards
  shadowConversion: "0 24px 60px rgba(15,23,42,0.14)", // High elevation: 28px CTA/conversion cards
  
  // Specialty/Inset shadows
  shadowInsetGlass: "inset 0 1px 0 rgba(255,255,255,0.92), 0 2px 3px rgba(0,0,0,0.09), 0 18px 48px rgba(0,0,0,0.10)",

  // Radius
  radiusAction: "rounded-xl",       // 12px — small action buttons/icon buttons
  radiusBtn: "rounded-full",        // Standardize all primary/secondary buttons to pill
  radiusCard: "rounded-2xl",        // 16px — standard cards
  radiusLargeCard: "rounded-[24px]", // oversized cards, hero images, modals
  radiusPanel: "rounded-[28px]",    // large feature panels, section wrappers
  radiusPill: "rounded-full",

  // Borders
  borderSubtle: "border border-black/[0.20]",
  borderLight: "border border-black/[0.18]",
  borderMedium: "border border-black/[0.28]",

  // Surface primitives
  surfaceCard: "rounded-2xl border border-black/[0.16] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.09)]",
  surfaceCardSoft: "rounded-2xl border border-black/[0.18] bg-white shadow-sm",
  surfacePanel: "rounded-[28px] border border-neutral-300/90 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.09)]",
  surfaceMuted: "bg-[var(--color-bg-secondary)] border-neutral-300/80",
  heroCarouselCardSurface: "rounded-none border bg-[var(--color-bg-secondary)]",
  heroCarouselCardMedia: "rounded-none border border-black/[0.16] bg-white",
  heroCarouselCardFooter: "rounded-none border-t border-black/[0.16] bg-[var(--color-bg-secondary)]",

  // Motion primitives
  motionInteractive: "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
  motionLift: "transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5",
  interactiveUnderline: "absolute -bottom-1 left-0 w-full h-[1.5px] bg-current transition-transform duration-300 ease-out origin-left scale-x-100 group-hover:scale-x-0",

  // Components
  primaryCTA: "bg-[var(--color-text-primary)] text-white hover:bg-black transition-all duration-300",
  secondaryCTA: "bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all duration-300",
  invertedCTA: "bg-white text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all duration-300",
  ghostCTA: "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all duration-300",



  // Avatar / chart accent palette (for testimonials, stats tints)
  avatarColors: [
    '#5c85d6', // Blue
    '#52a878', // Green
    '#cf8c38', // Amber
    '#d15e70', // Rose
    '#9366db', // Purple
    '#e08257', // Orange
    '#3ea8a8', // Teal
    '#d6709a', // Pink
  ],
};
