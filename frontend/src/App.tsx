import React, { useState, lazy, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet, RouteObject } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ContentProvider } from './context/ContentContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { HelmetProvider } from 'react-helmet-async';
import { helmetContext } from './ssr/helmetContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ReframeCS from './components/ReframeCS';
import FloatingCurrencySelector from './components/FloatingCurrencySelector';
import CookieConsent from './components/common/CookieConsent';
import ContinueBrowsing from './components/ContinueBrowsing';

import { ProtectedRoute } from './components/platform/ProtectedRoute';
import { ToastProvider } from './admin/ToastContext';
import { DashboardProvider } from './context/DashboardContext';
import { ModalProvider } from './context/ModalContext';
import { AppLockProvider } from './admin/AppLockContext';
import { useContent } from './context/ContentBase';
import { LenisProvider, useLenisRef } from './context/LenisContext';

const ScrollToTop: React.FC = () => {
  const lenisRef = useLenisRef();
  useEffect(() => {
    const lenis = lenisRef?.current;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};
import { ServicesProvider } from './context/ServicesContext';
import './App.css';



const BOOT_LOADER_SEEN_KEY = 'reframe_boot_loader_seen';
const BOOT_MIN_MS = 0;
const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|lighthouse|pagespeed|headless|facebookexternalhit|whatsapp|linkedinbot|twitterbot|discordbot|google-read-aloud/i;

const isLikelyCrawler = () => {
  if (typeof navigator === 'undefined') return false;
  return BOT_UA_PATTERN.test(navigator.userAgent || '');
};

// Synchronous check — computed before first render so showLoader can start true,
// preventing the 1-frame flash of page content before the effect fires.
const _initShowLoader = (() => {
  if (typeof navigator === 'undefined') return false;
  if (BOT_UA_PATTERN.test(navigator.userAgent || '')) return false;
  try { return sessionStorage.getItem(BOOT_LOADER_SEEN_KEY) !== '1'; } catch { return true; }
})();

// Thin top-of-viewport progress bar shown during lazy route transitions
const RouteLoader: React.FC = () => (
  <div className="fixed top-0 left-0 right-0 z-[110] h-[3px] overflow-hidden" style={{ background: 'transparent' }}>
    <div className="h-full w-full" style={{
      background: '#171717',
      animation: 'route-progress 2s ease-in-out infinite',
      transformOrigin: 'left',
    }} />
    <style>{`@keyframes route-progress { 0%{width:0;margin-left:0} 40%{width:30%;margin-left:0} 70%{width:60%;margin-left:30%} 100%{width:0;margin-left:100%} }`}</style>
  </div>
);

const BootLogo = () => (
  <svg width="116" height="120" viewBox="0 0 2003 2073" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M150 160L150 1918M142 153H1837M1852 160L1852 1918M1837 1925L142 1925" stroke="currentColor" strokeWidth="8"/>
    <path d="M1730 152.983H1974.16M1852.08 28V272.152" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M28 152.983H272.16M150.08 28V272.152" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M28 1924.98H272.16M150.08 1800V2044.15" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M1730 1924.98H1974.16M1852.08 1800V2044.15" stroke="currentColor" strokeWidth="56" strokeLinecap="round"/>
    <path d="M764.961 1646L413 1300.48V852.229H867.74L413 432L1278.52 432C1428.02 432 1580.64 531.61 1580.64 677.908V852.229H867.74L1581 1646H1157.41L764.961 1228.88V1646Z" fill="currentColor"/>
  </svg>
);

const BOOT_STATS = [
  { value: '$0.39+', label: 'Starting per image' },
  { value: '12h',    label: 'Turnaround time' },
  { value: '3',      label: 'Free sample edits' },
  { value: '100%',   label: 'Manual Pen Tool' },
];

const BOOT_SERVICES = [
  'Background Removal',
  'Clipping Path',
  'Ghost Mannequin',
  'Skin Retouching',
  'Color Correction',
  'Jewelry Editing',
  'Amazon-ready Images',
  'Storefront Optimisation',
];

const AppBootLoader: React.FC<{ exiting: boolean }> = ({ exiting }) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f8fbff 0%, #fff7ef 50%, #f5f3ff 100%)',
        opacity: exiting ? 0 : 1,
        transition: exiting ? 'opacity 0.6s ease' : 'opacity 0.3s ease',
      }}
    >
      {/* Coloured ambient blobs matching CTA section */}
      <div className="absolute inset-0 pointer-events-none" style={{ animation: 'boot-orb-in 1.6s ease both' }}>
        <div className="absolute top-[-20%] right-[-10%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: '#cfe6ff', opacity: 0.7, filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: '#ffd8bf', opacity: 0.6, filter: 'blur(80px)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.85), transparent 40%), radial-gradient(circle at 80% 85%, rgba(255,255,255,0.55), transparent 35%)' }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center px-8 w-full max-w-[620px]">

        {/* Logo */}
        <div className="text-gray-900" style={{ animation: 'boot-logo-in 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
          <BootLogo />
        </div>

        {/* Brand name — decorative only; <p> avoids a duplicate <h1> on every page */}
        <p
          className="mt-5 font-bold tracking-[-0.05em] text-gray-950 leading-none text-center"
          style={{ fontSize: 'clamp(36px, 5.5vw, 66px)', animation: 'boot-fade-up 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}
        >
          Reframe Visuals
        </p>

        {/* Tagline */}
        <p
          className="mt-3 text-gray-400 text-center font-medium"
          style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', animation: 'boot-fade-up 0.5s 0.28s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}
        >
          Human editors. Precise paths. Catalog-ready images.
        </p>


        {/* Stats — single glass strip with dividers */}
        <div
          className="mt-9 w-full flex rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.58)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.75)',
            boxShadow: '0 4px 28px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
            animation: 'boot-fade-up 0.55s 0.45s cubic-bezier(0.16,1,0.3,1) both',
            opacity: 0,
          }}
        >
          {BOOT_STATS.map((s, i) => (
            <div
              key={s.value}
              className="flex-1 flex flex-col items-center justify-center py-6 px-3"
              style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.11)' : 'none' }}
            >
              <span className="font-bold tracking-[-0.04em] text-gray-900 leading-none" style={{ fontSize: 'clamp(22px, 2.8vw, 36px)' }}>{s.value}</span>
              <span className="mt-2 text-gray-400 text-center font-medium leading-tight" style={{ fontSize: 'clamp(10px, 0.82vw, 12px)', letterSpacing: '0.01em' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Service pills */}
        <div
          className="mt-5 flex flex-wrap justify-center gap-2"
          style={{ animation: 'boot-fade-up 0.45s 0.62s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}
        >
          {BOOT_SERVICES.map((s) => (
            <span
              key={s}
              className="px-3 py-1 rounded-full font-medium text-gray-400"
              style={{ fontSize: 'clamp(10px, 0.78vw, 12px)', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.12)' }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-9 w-full max-w-[280px] flex flex-col items-center gap-3"
          style={{ animation: 'boot-fade-up 0.4s 0.32s cubic-bezier(0.16,1,0.3,1) both', opacity: 0 }}>
          <div className="h-[2px] w-full overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.09)' }}>
            <div className="h-full rounded-full" style={{ background: 'rgba(0,0,0,0.28)', animation: 'boot-fill 3.4s linear forwards' }} />
          </div>
          <p style={{ fontSize: '10px', letterSpacing: '0.22em' }} className="uppercase text-gray-400 font-semibold">
            Loading
          </p>
        </div>

      </div>

      <style>{`
        @keyframes boot-logo-in { from { opacity:0; transform:scale(0.84) } to { opacity:1; transform:scale(1) } }
        @keyframes boot-fade-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes boot-fill    { from { width:0% } to { width:100% } }
        @keyframes boot-orb-in  { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  );
};

// Internal component rendered inside providers to access real app state
export const AppBootManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthChecking } = useContent();
  // Start true on first visit so the loader covers the page from the very first paint,
  // preventing the FOUC where unstyled content flashes before the useEffect fires.
  const [showLoader, setShowLoader] = useState(_initShowLoader);
  const [exiting, setExiting] = useState(false);
  // Track conditions that must be met before dismissing
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const allReady = fontsLoaded && minTimeElapsed && !isAuthChecking;

  useEffect(() => {
    if (!showLoader) return; // crawler or returning visitor — skip setup

    // Minimum visual time
    const minTimer = setTimeout(() => setMinTimeElapsed(true), BOOT_MIN_MS);

    // Fonts loaded
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    } else {
      setFontsLoaded(true);
    }

    return () => clearTimeout(minTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss when all conditions met — fade out then unmount
  useEffect(() => {
    if (!allReady || !showLoader) return;
    try { sessionStorage.setItem(BOOT_LOADER_SEEN_KEY, '1'); } catch { /* ignore */ }
    setExiting(true);
    const id = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(id);
  }, [allReady, showLoader]);

  return (
    <>
      {showLoader && <AppBootLoader exiting={exiting} />}
      {children}
    </>
  );
};

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./sections/LandingPage').then(m => ({ default: m.default })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.default })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.default })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then(m => ({ default: m.default })));
const ServiceIntentPage = lazy(() => import('./pages/ServiceIntentPage').then(m => ({ default: m.default })));
const ServiceComparisonPage = lazy(() => import('./pages/ServiceComparisonPage').then(m => ({ default: m.default })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.default })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.default })));
const AboutReframeVisualsPage = lazy(() => import('./pages/AboutReframeVisualsPage').then(m => ({ default: m.default })));
const ReframeVisualsServicesPage = lazy(() => import('./pages/ReframeVisualsServicesPage').then(m => ({ default: m.default })));
const AIProductVisualsPage = lazy(() => import('./pages/AIProductVisualsPage').then(m => ({ default: m.default })));
const BlogListingPage = lazy(() => import('./pages/BlogListingPage').then(m => ({ default: m.default })));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.default })));
const FreeTrialPage = lazy(() => import('./pages/FreeTrialPage').then(m => ({ default: m.default })));
const StartPage = lazy(() => import('./pages/StartPage').then(m => ({ default: m.default })));
const PilotBatchPage = lazy(() => import('./pages/PilotBatchPage').then(m => ({ default: m.default })));
const BookMeetingPage = lazy(() => import('./pages/BookMeetingPage').then(m => ({ default: m.default })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.default })));
const PolicyPage = lazy(() => import('./pages/PolicyPage').then(m => ({ default: m.default })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.default })));
const LoginPageUser = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.default })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.default })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.default })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.default })));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.default })));
const BlogTopicPage = lazy(() => import('./pages/BlogTopicPage').then(m => ({ default: m.default })));
const CmsPageView = lazy(() => import('./pages/CmsPageView').then(m => ({ default: m.default })));
const BlogSeriesPage = lazy(() => import('./pages/BlogSeriesPage').then(m => ({ default: m.default })));
const ExpansionPage = lazy(() => import('./pages/ExpansionPage').then(m => ({ default: m.default })));
const CaseStudiesHubPage = lazy(() => import('./pages/CaseStudiesHubPage').then(m => ({ default: m.default })));
const CaseStudyDetailPage = lazy(() => import('./pages/CaseStudyDetailPage').then(m => ({ default: m.default })));
const InsightAndTrustPage = lazy(() => import('./pages/InsightAndTrustPage').then(m => ({ default: m.default })));
const QuoteBuilderPage = lazy(() => import('./pages/QuoteBuilderPage').then(m => ({ default: m.default })));

const LoginPage = lazy(() => import('./admin/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminResetPassword = lazy(() => import('./admin/pages/AdminResetPassword').then(m => ({ default: m.AdminResetPassword })));
const AdminForgotPassword = lazy(() => import('./admin/pages/AdminForgotPassword').then(m => ({ default: m.AdminForgotPassword })));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminProtectedRoute = lazy(() => import('./admin/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));
const AuditLogPage = lazy(() => import('./admin/pages/AuditLogPage').then(m => ({ default: m.default })));
const UsersPage = lazy(() => import('./admin/pages/UsersPage').then(m => ({ default: m.default })));
const PublicOrderPage = lazy(() => import('./pages/PublicOrderPage').then(m => ({ default: m.default })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.default })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then(m => ({ default: m.default })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.default })));
const PlatformPage = lazy(() => import('./pages/PlatformPage').then(m => ({ default: m.default })));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage').then(m => ({ default: m.default })));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage').then(m => ({ default: m.default })));

// Error Boundary Component
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed');
      
    if (isChunkLoadError) {
      const reloadCount = parseInt(sessionStorage.getItem('chunk_reload_count') || '0', 10);
      if (reloadCount < 2) {
        sessionStorage.setItem('chunk_reload_count', (reloadCount + 1).toString());
        window.location.reload();
        return;
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 font-sans max-w-3xl mx-auto">
          <h1 className="text-red-600 text-2xl font-semibold mb-4">Something went wrong</h1>
          <pre className="bg-red-50 p-4 rounded-lg text-[13px] overflow-auto">
            {this.state.error?.message}
          </pre>
          <p className="mt-4 text-neutral-500">Check the browser console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Pause decorative infinite animations when tab is hidden ───
const useVisibilityAnimationPause = () => {
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        document.documentElement.classList.add('animations-paused');
      } else {
        document.documentElement.classList.remove('animations-paused');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
};

// ─── Assistant Helper ───

const AssistantWrapper: React.FC = () => {
  useVisibilityAnimationPause();
  return <ReframeCS />;
};

// ─── Public Site Layout ───

const PublicSite: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isPlatformPage = location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/account') || 
    location.pathname.startsWith('/jobs');

  const hideFooter = isPlatformPage ||
    location.pathname === '/free-trial' ||
    location.pathname === '/start' ||
    location.pathname === '/pilot-batch' ||
    location.pathname === '/book-meeting' ||
    location.pathname === '/order' ||
    location.pathname === '/order/new';
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isFocusedConversionPage = ['/free-trial', '/start', '/pilot-batch', '/contact', '/order/new'].includes(location.pathname);
  const isAboutPage = ['/about', '/about-reframe-visuals'].includes(location.pathname);
  const shouldHideAssistant = isFocusedConversionPage || isAuthPage;
  const showContinueBrowsing = location.pathname !== '/' && !isPlatformPage && !isAuthPage && !isFocusedConversionPage && !isAboutPage && location.pathname !== '/order';

  const isDashboard = location.pathname.startsWith('/dashboard');
  const transitionKey = isDashboard ? '/dashboard' : location.pathname;

  return (
    <LenisProvider>
      <div className="min-h-screen flex flex-col bg-[var(--surface)] text-black overflow-x-hidden min-w-0 antialiased" style={{ isolation: 'isolate' }}>
        <Navigation
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className={`${isPlatformPage ? '' : 'pt-16'} flex-grow flex flex-col min-w-0`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={transitionKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex-grow flex flex-col min-w-0"
              style={{ willChange: 'opacity' }}
            >
              <ScrollToTop />
              <Suspense fallback={<RouteLoader />}>
                <Outlet />
                {showContinueBrowsing && <ContinueBrowsing />}
                {!hideFooter && <Footer />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <AnimatePresence>
          {!isPlatformPage && !shouldHideAssistant && <AssistantWrapper key="leica-assistant" />}
        </AnimatePresence>

        {!isFocusedConversionPage && <FloatingCurrencySelector />}
        <CookieConsent />
      </div>
    </LenisProvider>
  );
};

// ─── Routes Configuration for SSG ───

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const RootProviders: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ContentProvider>
          <HelmetProvider context={helmetContext}>
            <ErrorBoundary>
              <ModalProvider>
                <ServicesProvider>
                  <DashboardProvider>
                    <AppBootManager>
                      <Outlet />
                    </AppBootManager>
                  </DashboardProvider>
                </ServicesProvider>
              </ModalProvider>
            </ErrorBoundary>
          </HelmetProvider>
        </ContentProvider>
      </CurrencyProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export const routes: RouteObject[] = [
  {
    element: <RootProviders />,
    children: [
      {
        path: '/admin/login',
        element: <Suspense fallback={<RouteLoader />}><LoginPage /></Suspense>
      },
      {
        path: '/admin/reset-password',
        element: <Suspense fallback={<RouteLoader />}><AdminResetPassword /></Suspense>
      },
      {
        path: '/admin/forgot-password',
        element: <Suspense fallback={<RouteLoader />}><AdminForgotPassword /></Suspense>
      },
      {
        path: '/admin/*',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <AdminProtectedRoute>
              <ToastProvider>
                <AppLockProvider>
                  <AdminLayout />
                </AppLockProvider>
              </ToastProvider>
            </AdminProtectedRoute>
          </Suspense>
        )
      },
      {
        element: <PublicSite />,
        children: [
          { path: '', element: <LandingPage /> },
          { path: 'services', element: <ServicesPage /> },
          { path: 'how-it-works', element: <HowItWorksPage /> },
          { path: 'platform', element: <PlatformPage /> },
          { path: 'services/:serviceId', element: <ServiceDetailPage /> },
          { path: 'services/:serviceId/:intent', element: <ServiceIntentPage /> },
          { path: 'compare/:slug', element: <ServiceComparisonPage /> },
          { path: 'order', element: <PublicOrderPage /> },
          { path: 'order/new', element: <PublicOrderPage variant="new" /> },
          { path: 'pricing', element: <PricingPage /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'about-reframe-visuals', element: <AboutReframeVisualsPage /> },
          { path: 'reframe-visuals-services', element: <ReframeVisualsServicesPage /> },
          { path: 'ai-product-visuals', element: <AIProductVisualsPage /> },
          { path: 'portfolio', element: <PortfolioPage /> },
          { path: 'testimonials', element: <TestimonialsPage /> },
          { path: 'blog', element: <BlogListingPage /> },
          { path: 'blog/:slug', element: <BlogPostPage /> },
          { path: 'blog/topic/:topicSlug', element: <BlogTopicPage /> },
          { path: 'p/:slug', element: <Suspense fallback={<RouteLoader />}><CmsPageView /></Suspense> },
          { path: 'blog/series/:seriesSlug', element: <BlogSeriesPage /> },
          { path: 'insights', element: <Navigate to="/blog" replace /> },
          { path: 'insights/:slug', element: <Navigate to="/blog" replace /> },
          { path: 'case-studies', element: <CaseStudiesHubPage /> },
          { path: 'case-studies/:slug', element: <CaseStudyDetailPage /> },
          { path: 'quality-assurance-process', element: <InsightAndTrustPage /> },
          { path: 'turnaround-sla', element: <InsightAndTrustPage /> },
          { path: 'who-is-reframe-visuals', element: <InsightAndTrustPage /> },
          { path: 'reframe-visuals-brand-facts', element: <InsightAndTrustPage /> },
          { path: 'free-sample-edit', element: <InsightAndTrustPage /> },
          { path: 'reframe-visuals-pricing', element: <InsightAndTrustPage /> },
          { path: 'reframe-visuals-reviews', element: <InsightAndTrustPage /> },
          { path: 'reframe-visuals-for-shopify-brands', element: <InsightAndTrustPage /> },
          { path: 'reframe-visuals-for-amazon-sellers', element: <InsightAndTrustPage /> },

          { path: 'amazon-product-image-editing', element: <ExpansionPage /> },
          { path: 'shopify-product-photo-editing', element: <ExpansionPage /> },
          { path: 'woocommerce-product-image-editing', element: <ExpansionPage /> },
          { path: 'fashion-photo-retouching-service', element: <ExpansionPage /> },
          { path: 'jewelry-photo-retouching-service', element: <ExpansionPage /> },
          { path: 'furniture-photo-editing-service', element: <ExpansionPage /> },

          { path: 'us-photo-editing-service', element: <ExpansionPage /> },
          { path: 'uk-photo-editing-service', element: <ExpansionPage /> },
          { path: 'canada-photo-editing-service', element: <ExpansionPage /> },
          { path: 'australia-photo-editing-service', element: <ExpansionPage /> },
          { path: 'uae-photo-editing-service', element: <ExpansionPage /> },
          { path: 'singapore-photo-editing-service', element: <ExpansionPage /> },

          { path: 'resources', element: <Suspense fallback={<RouteLoader />}><ResourcesPage /></Suspense> },
          { path: 'resources/amazon-image-compliance-checklist-2026', element: <InsightAndTrustPage /> },
          { path: 'resources/shopify-product-photography-conversion-playbook', element: <InsightAndTrustPage /> },
          { path: 'resources/ghost-mannequin-vs-flat-lay-when-to-use-each', element: <InsightAndTrustPage /> },
          { path: 'resources/how-to-scale-photo-editing-for-10000-skus', element: <InsightAndTrustPage /> },
          { path: 'resources/jewelry-retouching-quality-checklist', element: <InsightAndTrustPage /> },
          { path: 'resources/ecommerce-image-sla-framework-for-growth-teams', element: <InsightAndTrustPage /> },
          { path: 'resources/best-ecommerce-photo-editing-services-shopify-brands', element: <InsightAndTrustPage /> },
          { path: 'resources/ghost-mannequin-editing-cost-guide', element: <InsightAndTrustPage /> },
          { path: 'resources/background-removal-service-pricing-guide', element: <InsightAndTrustPage /> },
          { path: 'resources/how-to-prepare-product-photos-for-amazon', element: <InsightAndTrustPage /> },
          { path: 'resources/jewelry-retouching-checklist-for-ecommerce', element: <InsightAndTrustPage /> },
          { path: 'resources/clipping-path-vs-background-removal', element: <InsightAndTrustPage /> },
          { path: 'resources/in-house-vs-outsourced-product-photo-editing', element: <InsightAndTrustPage /> },
          { path: 'pixelz-alternative', element: <Suspense fallback={<RouteLoader />}><ComparisonPage /></Suspense> },
          { path: 'clipping-path-india-alternative', element: <Suspense fallback={<RouteLoader />}><ComparisonPage /></Suspense> },
          { path: 'cutoutwiz-alternative', element: <Suspense fallback={<RouteLoader />}><ComparisonPage /></Suspense> },
          { path: 'free-trial', element: <FreeTrialPage /> },
          { path: 'start', element: <StartPage /> },
          { path: 'pilot-batch', element: <PilotBatchPage /> },
          { path: 'book-meeting', element: <BookMeetingPage /> },
          { path: 'contact', element: <ContactPage /> },
          { path: 'support', element: <Navigate to="/contact" replace /> },
          { path: 'privacy', element: <PolicyPage /> },
          { path: 'terms', element: <PolicyPage /> },
          { path: 'cookies', element: <PolicyPage /> },
          { path: 'security', element: <PolicyPage /> },
          { path: 'quote-builder', element: <QuoteBuilderPage /> },
          { path: 'design-system', element: <DesignSystemPage /> },

          { path: 'signup', element: <SignUpPage /> },
          { path: 'login', element: <LoginPageUser /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },

          { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
          { path: 'dashboard/orders', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
          { path: 'dashboard/gallery', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
          { path: 'dashboard/billing', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
          { path: 'dashboard/account', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
          { path: 'dashboard/studio', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },

          { path: '*', element: <Suspense fallback={<RouteLoader />}><NotFoundPage /></Suspense> },
        ]
      }
    ]
  }
];

// ─── App ───
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const App: React.FC = () => {

  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
};

export default App;
