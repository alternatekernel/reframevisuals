// Server-side port of applyTheme()/syncWithBackend() from context/ContentContext.tsx so pages carry the same
// CSS variables and Google Fonts as the React app, without needing the React provider at runtime.
import { DEFAULT_THEME, type ThemeSettings } from '../admin/types';
import { apiGet } from './serverApi';

const hexToRgb = (hex: string) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '233, 116, 81';
};

// Inline style on <html> (like applyTheme's root.style.setProperty) so it beats the :root defaults in global.css.
export function themeToInlineStyle(theme: ThemeSettings): string {
  const v: Array<[string, string]> = [
    ['--font-heading', `'${theme.fonts.heading}', sans-serif`],
    ['--font-body', `'${theme.fonts.body}', sans-serif`],
    ['--font-mono', `'${theme.fonts.mono}', monospace`],
    ['--brand', theme.colors.brand],
    ['--brand-rgb', hexToRgb(theme.colors.brand)],
    ['--brand-hover', theme.colors.brandHover],
    ['--brand-hover-rgb', hexToRgb(theme.colors.brandHover)],
    ['--surface', '#FFFFFF'],
    ['--onyx', theme.colors.onyx],
    ['--cat-foundation', theme.colors.categoryFoundation],
    ['--cat-enhancement', theme.colors.categoryEnhancement],
    ['--cat-retouch', theme.colors.categoryRetouch],
    ['--cat-advanced', theme.colors.categoryAdvanced],
    ['--ambient-orb', theme.colors.ambientOrb],
    ['--chat-bubbles', theme.colors.chatBubbles],
    ['--footer-dark', theme.colors.footerDark],
    ['--accent-lavender', theme.colors.accentLavender],
    ['--base-font-size', `${theme.typography.baseFontSize}px`],
    ['--heading-scale', String(theme.typography.headingScale)],
    ['--line-height', String(theme.typography.lineHeight)],
    ['--letter-spacing', `${theme.typography.letterSpacing}em`],
    ['--radius-sm', `${theme.radius.sm}px`],
    ['--radius-md', `${theme.radius.md}px`],
    ['--radius-lg', `${theme.radius.lg}px`],
    ['--radius-xl', `${theme.radius.xl}px`],
  ];
  return v.map(([k, val]) => `${k}:${val}`).join(';');
}

const GOOGLE_FONTS = ['Google Sans', 'DM Sans', 'JetBrains Mono', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Raleway', 'Oswald', 'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Ubuntu', 'PT Sans', 'Crimson Text', 'Work Sans', 'Karla', 'Libre Baskerville'];

export function fontsHref(theme: ThemeSettings): string | null {
  const fonts = [theme.fonts.heading, theme.fonts.body, theme.fonts.mono]
    .filter((f, i, a) => a.indexOf(f) === i)
    .filter((f) => GOOGLE_FONTS.some((g) => f.toLowerCase().includes(g.toLowerCase())));
  if (!fonts.length) return null;
  const fam = fonts.map((f) => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900`).join('&');
  return `https://fonts.googleapis.com/css2?${fam}&display=swap`;
}

let cached: Promise<ThemeSettings> | null = null;
export function loadTheme(): Promise<ThemeSettings> {
  cached ??= (async () => {
    const res = await apiGet<{ success?: boolean; data?: any }>('/theme');
    const t = res?.success ? res.data : null;
    if (!t) return DEFAULT_THEME;
    const d = DEFAULT_THEME;
    return {
      fonts: { heading: 'Google Sans', body: 'Google Sans', mono: 'JetBrains Mono' },
      colors: {
        brand: t.brand || d.colors.brand, brandHover: t.brandHover || d.colors.brandHover, surface: '#FFFFFF', onyx: t.onyx || d.colors.onyx,
        categoryFoundation: t.categoryFoundation || d.colors.categoryFoundation, categoryEnhancement: t.categoryEnhancement || d.colors.categoryEnhancement,
        categoryRetouch: t.categoryRetouch || d.colors.categoryRetouch, categoryAdvanced: t.categoryAdvanced || d.colors.categoryAdvanced,
        ambientOrb: t.ambientOrb || d.colors.ambientOrb, chatBubbles: t.chatBubbles || d.colors.chatBubbles,
        footerDark: t.footerDark || d.colors.footerDark, accentLavender: t.accentLavender || d.colors.accentLavender,
      },
      typography: {
        baseFontSize: t.baseFontSize || d.typography.baseFontSize, headingScale: t.headingScale || d.typography.headingScale,
        lineHeight: t.lineHeight || d.typography.lineHeight, letterSpacing: t.letterSpacing || d.typography.letterSpacing,
      },
      radius: { sm: t.radiusSm || d.radius.sm, md: t.radiusMd || d.radius.md, lg: t.radiusLg || d.radius.lg, xl: t.radiusXl || d.radius.xl },
    } as ThemeSettings;
  })();
  return cached;
}
