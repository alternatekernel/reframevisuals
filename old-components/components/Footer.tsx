import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Linkedin,
  Instagram,
  ArrowRight,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useContent } from '../context/ContentBase';
import { cx, layout } from '../utils/theme';
import { Button } from './ui/button';
import { ButtonWithIcon } from './ui/button-with-icon';
import Logo from './ui/Logo';
import Frame from './ui/Frame';

interface SocialLink {
  platform: string;
  url: string;
}

interface NavLink {
  label: string;
  path: string;
}

interface LinkGroup {
  title: string;
  links: NavLink[];
}

interface FooterContent {
  brandName: string;
  brandDescription: string;
  trustNumber: string;
  trustLabel: string;
  ctaLabel: string;
  ctaTitle: string;
  copyright: string;
  status: string;
  version: string;
  socialLinks: SocialLink[];
  linkGroups: LinkGroup[];
}

const XLogoIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
    <path d="M18.244 2H21.5l-7.1 8.114L22.75 22h-6.54l-5.121-6.712L5.206 22H1.95l7.59-8.674L1.5 2h6.707l4.63 6.119L18.244 2Zm-1.146 18h1.804L7.285 3.896H5.349L17.098 20Z" />
  </svg>
);

const PinterestIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
    <path d="M12.04 2C6.55 2 3 5.7 3 10.38c0 2.17 1.2 4.87 3.13 5.72.29.13.45.07.52-.2.05-.2.31-1.23.43-1.7.04-.15.02-.29-.1-.44-.64-.78-1.15-2.2-1.15-3.54 0-3.26 2.47-6.4 6.68-6.4 3.64 0 6.18 2.48 6.18 6.03 0 4-2.02 6.78-4.65 6.78-1.45 0-2.54-1.2-2.19-2.67.42-1.75 1.23-3.64 1.23-4.9 0-1.13-.61-2.08-1.87-2.08-1.48 0-2.67 1.53-2.67 3.59 0 1.31.44 2.19.44 2.19l-1.8 7.61c-.31 1.3-.19 3.12-.05 4.3.04.34.49.46.66.17.63-1.03 1.65-2.78 1.99-4.04.12-.46.63-2.39.63-2.39.56 1.06 2.19 1.95 3.92 1.95 5.16 0 8.88-4.74 8.88-10.63C23.22 5.21 18.92 2 12.04 2Z" />
  </svg>
);

const BehanceIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
    <path d="M3 6h6.2c2.48 0 4.02 1.16 4.02 3.08 0 1.16-.53 2-1.55 2.5 1.34.38 2.09 1.43 2.09 2.96 0 2.2-1.78 3.46-4.47 3.46H3V6Zm5.83 4.75c1.05 0 1.65-.45 1.65-1.25s-.56-1.2-1.67-1.2H5.8v2.45h3.03Zm.25 4.95c1.22 0 1.9-.5 1.9-1.43 0-.92-.68-1.42-1.95-1.42H5.8v2.85h3.28ZM16.25 7.2h5.4v1.45h-5.4V7.2Zm2.75 3.15c2.7 0 4.25 1.72 4.25 4.6v.58h-6.06c.17 1.13.84 1.74 1.96 1.74.82 0 1.36-.31 1.66-.93h2.28c-.54 1.77-2.03 2.86-3.99 2.86-2.64 0-4.27-1.73-4.27-4.42 0-2.64 1.68-4.43 4.17-4.43Zm1.87 3.68c-.13-1.03-.76-1.6-1.81-1.6-1.02 0-1.68.58-1.86 1.6h3.67Z" />
  </svg>
);

const TikTokIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
    <path d="M15.5 2c.35 3.05 2.07 4.86 5 5.05v3.28a8.64 8.64 0 0 1-5-1.57v6.06c0 4.06-2.58 6.98-6.25 6.98-3.2 0-5.75-2.35-5.75-5.5 0-3.64 3.33-6.17 7.03-5.36v3.45c-1.83-.58-3.58.38-3.58 1.9 0 1.22.98 2.09 2.2 2.09 1.44 0 2.52-.92 2.52-3.12V2h3.83Z" />
  </svg>
);

const TrustpilotIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
    <path d="m12 2.4 2.9 5.88 6.5.95-4.7 4.58 1.1 6.47L12 17.23l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95L12 2.4Z" />
  </svg>
);

const SOCIAL_ICON_MAP: Record<string, React.ElementType> = {
  x: XLogoIcon,
  twitter: XLogoIcon,
  linkedin: Linkedin,
  instagram: Instagram,
  pinterest: PinterestIcon,
  behance: BehanceIcon,
  trustpilot: TrustpilotIcon,
  tiktok: TikTokIcon,
};

const getPageTitle = () => {
  if (typeof document === 'undefined') return '';
  return document.title.replace(/\s*\|\s*Reframe.*$/i, '').trim();
};

const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getSectionContent, isUserAuthenticated } = useContent();
  const [isAtBottom, setIsAtBottom] = React.useState(false);

  React.useEffect(() => {
    // Cache the document height: reading scrollHeight inside the scroll handler
    // forces a synchronous reflow on every scroll frame (Lenis + animations dirty
    // layout each frame). The 400ms interval + resize listener keep it fresh.
    let cachedScrollHeight = 0;

    const check = () => {
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const clientHeight = window.innerHeight;

      if (cachedScrollHeight <= clientHeight + 40) {
        setIsAtBottom(true);
        return;
      }

      const threshold = 120;
      const reachedBottom = (scrollTop + clientHeight) >= (cachedScrollHeight - threshold);
      setIsAtBottom(reachedBottom);
    };

    const measureAndCheck = () => {
      cachedScrollHeight = document.documentElement.scrollHeight;
      check();
    };

    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', measureAndCheck, { passive: true });
    measureAndCheck();

    const interval = setInterval(measureAndCheck, 400);

    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', measureAndCheck);
      clearInterval(interval);
    };
  }, [location.pathname]);
  
  const handleOpenFeedback = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const pageTitle = getPageTitle() || 'this page';
    const pagePath = location.pathname;
    window.dispatchEvent(new CustomEvent('reframe-cs:open', {
      detail: {
        mode: 'feedback-escalation',
        issueType: 'general',
        pageTitle,
        pagePath,
        prompt: `Hi, I need help with a general issue on ${pageTitle} (${pagePath}).`
      }
    }));
  };

  const content = getSectionContent('footer') as FooterContent;
  const linkGroups = content.linkGroups || [];
  const socialLinks = content.socialLinks || [];
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  if (location.pathname === '/free-trial') return null;

  return (
    <footer className="relative bg-[#0a0a0f] text-white overflow-hidden border-t border-white/[0.06]">


      <div className={cx(layout.contentShell, 'relative z-10')}>
        {/* CTA Bar */}
        <div className="px-4 py-5 sm:py-8 lg:px-0 lg:py-12 border-b border-white/[0.08]">
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-5 sm:gap-6 lg:gap-8">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <h3 className="font-heading text-[24px] sm:text-[30px] font-bold mb-1 sm:mb-2 leading-tight">
                Start with 3 free edits.
              </h3>
              <p className="text-white/50 text-[14px] sm:text-[16px]">
                Hand-traced edges. Two-stage QA. No minimum order.
              </p>
            </div>

            <ButtonWithIcon
              variant="white"
              label={isUserAuthenticated ? 'Start New Job' : 'Get 3 Free Sample Edits'}
              onClick={() => navigate(isUserAuthenticated ? '/dashboard?view=new-project' : '/free-trial')}
            />
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="px-4 py-5 sm:py-10 lg:px-0 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-9 lg:gap-14">
            {/* Brand Column with animated reveal */}
            <div className="sm:col-span-2 md:col-span-4 space-y-3 sm:space-y-5">
              <div>
                <Logo light />
              </div>

              <p className="text-white/50 text-[14px] sm:text-[15px] leading-[1.45] sm:leading-relaxed max-w-[320px]">
                {content.brandDescription}
              </p>

              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, i) => {
                  const normalizedPlatform = (link.platform || '').toLowerCase();
                  const Icon = SOCIAL_ICON_MAP[normalizedPlatform] || Globe;
                  const resolvedUrl =
                    link.url && link.url !== '#'
                      ? link.url
                      : normalizedPlatform === 'instagram'
                        ? 'https://www.instagram.com/reframevisualsstudio/'
                        : normalizedPlatform === 'linkedin'
                          ? 'https://www.linkedin.com/company/reframe-visuals/'
                          : normalizedPlatform === 'pinterest'
                            ? 'https://www.pinterest.com/reframevisuals/'
                            : normalizedPlatform === 'behance'
                              ? 'https://www.behance.net/reframevisuals'
                              : normalizedPlatform === 'x' || normalizedPlatform === 'twitter'
                                ? 'https://x.com/ReframeVisual'
                                : normalizedPlatform === 'trustpilot'
                                  ? 'https://www.trustpilot.com/review/reframevisuals.com'
                                  : normalizedPlatform === 'tiktok'
                                    ? 'https://www.tiktok.com/@reframe_visuals'
                          : '#';
                  return (
                    <a
                      key={i}
                      href={resolvedUrl}
                      className="w-12 h-12 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[var(--brand)] hover:border-[var(--brand)] hover:text-white transition-all duration-300 touch-manipulation"
                      target={resolvedUrl !== '#' ? '_blank' : undefined}
                      rel={resolvedUrl !== '#' ? 'noopener noreferrer' : undefined}
                      aria-label={link.platform}
                    >
                      <Icon size={18} className="sm:w-[15px] sm:h-[15px]" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Link Groups with staggered animation */}
            <div className="sm:col-span-2 md:col-span-8">
              <div className="hidden md:grid grid-cols-4 gap-x-6 gap-y-5">
                {linkGroups.map((group) => {
                  return (
                    <div key={group.title} className="col-span-1">
                      <h5 className="font-heading font-bold text-[12px] sm:text-[13px] text-white/60 uppercase mb-2 sm:mb-2.5 tracking-[0.12em]">
                        {group.title}
                      </h5>
                      <ul className="space-y-0.5 sm:space-y-1.5">
                        {group.links.map((link) => (
                          <li
                            key={link.label}
                          >
                            <Link
                              to={link.path}
                              className="group flex min-h-8 items-center gap-2 text-[14px] text-white/55 hover:text-white hover:translate-x-1 transition-all touch-manipulation"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[var(--brand)] transition-colors" />
                              <span>{link.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="md:hidden space-y-1.5">
                {linkGroups.map((group) => {
                  const isOpen = openGroup === group.title;
                  return (
                    <div key={group.title} className="rounded-lg border border-white/10 bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => setOpenGroup((prev) => (prev === group.title ? null : group.title))}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                      >
                        <span className="font-heading font-bold text-[11px] text-white/55 uppercase tracking-[0.14em]">
                          {group.title}
                        </span>
                        {isOpen ? <ChevronUp size={14} className="text-white/45" /> : <ChevronDown size={14} className="text-white/45" />}
                      </button>
                      {isOpen && (
                        <ul className="border-t border-white/10 px-3 py-2 space-y-0.5">
                          {group.links.map((link) => (
                            <li key={link.label}>
                              <Link
                                to={link.path}
                                className="group flex min-h-8 items-center gap-2 text-[13px] text-white/55 hover:text-white transition-all touch-manipulation"
                              >
                                <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[var(--brand)] transition-colors" />
                                <span>{link.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div
            data-mobile-contact-region
            className="mt-4 sm:mt-8 border-t border-white/[0.12] pt-4 sm:pt-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1.5">
                <span className="block font-semibold uppercase tracking-[0.1em] text-white/70">Contact</span>
                <p className="text-[14px] leading-relaxed text-white/70 sm:text-[15px]">
                  <a
                    className="font-medium text-white hover:text-white transition-colors underline decoration-white/30 underline-offset-2"
                    href="mailto:hello@reframevisuals.com"
                  >
                    hello@reframevisuals.com
                  </a>
                  <span className="text-white/60"> · replies within 30 min</span>
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('reframe-cs:open'));
                  }}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  Open chat
                </button>
                <Link
                  to="/book-meeting"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  Book a meeting
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 px-4 pt-6 pb-[calc(104px+env(safe-area-inset-bottom))] lg:pb-32 lg:px-0 border-t border-white/[0.06]">
          <Frame light size="sm" className="opacity-100 mx-auto lg:mx-0">
            <div className="flex flex-col items-center lg:items-start gap-1 px-3 py-1 text-center lg:text-left">
              <div className="text-[12px] text-white/80 font-medium">
                <span>{content.version}</span>
              </div>
              <div className="text-[12px] text-white/60">
                {content.copyright}
              </div>
            </div>
          </Frame>

          <Frame light className="opacity-100 mx-auto lg:mx-0">
            <div className="flex items-center justify-center gap-3 py-1.5 px-3 sm:gap-4 sm:px-6">
              <div className="w-5 h-5">
                <img src="/logo.svg" alt="Reframe Visuals" className="w-full h-full object-contain opacity-85 brightness-0 invert" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white/75 text-center">
                Precision Design by Reframe Visuals
              </span>
            </div>
          </Frame>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

