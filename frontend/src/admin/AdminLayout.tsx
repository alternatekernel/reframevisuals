import React, { useState, useEffect, Suspense, useCallback, lazy } from 'react';

import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './admin-notion.css';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAuthProfile } from './hooks/useAdminData';
import { useAppLock } from './AppLockContext';
import { LockScreen } from './LockScreen';

// ─── Lazy-loaded page components (H9 fix: code splitting for all 31+ admin pages) ───
// DashboardHomePage is loaded eagerly since it's always the first page seen.
import { DashboardHomePage } from './DashboardHomePage';
const ChatsPage = lazy(() => import('./pages/ChatsPage').then(m => ({ default: m.ChatsPage })));
const SupportHubPage = lazy(() => import('./pages/SupportHubPage').then(m => ({ default: m.SupportHubPage })));
const ProductionPage = lazy(() => import('./pages/ProductionPage').then(m => ({ default: m.ProductionPage })));
const ProductionOrderDetailPage = lazy(() => import('./pages/ProductionOrderDetailPage').then(m => ({ default: m.ProductionOrderDetailPage })));
const AdminOrderReview = lazy(() => import('./pages/AdminOrderReview').then(m => ({ default: m.AdminOrderReview })));
const LeadsPage = lazy(() => import('./pages/LeadsPage').then(m => ({ default: m.LeadsPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const PipelinePage = lazy(() => import('./pages/PipelinePage').then(m => ({ default: m.PipelinePage })));
const DealsPage = lazy(() => import('./pages/DealsPage').then(m => ({ default: m.DealsPage })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const AutomationPage = lazy(() => import('./pages/AutomationPage').then(m => ({ default: m.AutomationPage })));
const LandingPagesPage = lazy(() => import('./pages/LandingPagesPage').then(m => ({ default: m.LandingPagesPage })));
const QuoteBuilderPage = lazy(() => import('./pages/QuoteBuilderPage').then(m => ({ default: m.QuoteBuilderPage })));
const QuoteRequestsPage = lazy(() => import('./pages/QuoteRequestsPage'));
const QuoteTemplatesPage = lazy(() => import('./pages/QuoteTemplatesPage').then(m => ({ default: m.QuoteTemplatesPage })));
const PlatformCustomizationPage = lazy(() => import('./pages/PlatformCustomizationPage').then(m => ({ default: m.PlatformCustomizationPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const VisitorAnalyticsPage = lazy(() => import('./pages/VisitorAnalyticsPage').then(m => ({ default: m.VisitorAnalyticsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const AdminCustomOrder = lazy(() => import('./pages/AdminCustomOrder').then(m => ({ default: m.AdminCustomOrder })));
const InvoicingPage = lazy(() => import('./pages/InvoicingPage').then(m => ({ default: m.InvoicingPage })));
const PayrollPage = lazy(() => import('./pages/PayrollPage').then(m => ({ default: m.PayrollPage })));
const PayoutDisbursementPage = lazy(() => import('./pages/PayoutDisbursementPage').then(m => ({ default: m.PayoutDisbursementPage })));
const PricingMatrixPage = lazy(() => import('./pages/PricingMatrixPage').then(m => ({ default: m.PricingMatrixPage })));
const TeamDirectoryPage = lazy(() => import('./pages/TeamDirectoryPage').then(m => ({ default: m.TeamDirectoryPage })));
const TaskBoardPage = lazy(() => import('./pages/TaskBoardPage').then(m => ({ default: m.TaskBoardPage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const CompliancePage = lazy(() => import('./pages/CompliancePage').then(m => ({ default: m.CompliancePage })));
const QualityControlPage = lazy(() => import('./pages/QualityControlPage').then(m => ({ default: m.QualityControlPage })));
const CMSStoragePage = lazy(() => import('./pages/CMSStoragePage').then(m => ({ default: m.CMSStoragePage })));
const ChatbotConfigPage = lazy(() => import('./pages/ChatbotConfigPage').then(m => ({ default: m.ChatbotConfigPage })));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage').then(m => ({ default: m.WatchlistPage })));
const NDAManagementPage = lazy(() => import('./pages/NDAManagementPage').then(m => ({ default: m.NDAManagementPage })));
const StyleGuidePage = lazy(() => import('./pages/StyleGuidePage').then(m => ({ default: m.StyleGuidePage })));
const DiscountsPage = lazy(() => import('./pages/DiscountsPage').then(m => ({ default: m.DiscountsPage })));
const AssetLibraryPage = lazy(() => import('./pages/AssetLibraryPage').then(m => ({ default: m.AssetLibraryPage })));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));
const PartnershipsPage = lazy(() => import('./pages/PartnershipsPage').then(m => ({ default: m.PartnershipsPage })));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then(m => ({ default: m.default })));
const FinancePage = lazy(() => import('./pages/FinancePage').then(m => ({ default: m.FinancePage })));
const MeetingRequestsPage = lazy(() => import('./pages/MeetingRequestsPage'));
const CustomerDashboardPage = lazy(() => import('./pages/CustomerDashboardPage').then(m => ({ default: m.CustomerDashboardPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.default })));
const BlogPostsPage = lazy(() => import('./pages/BlogPostsPage').then(m => ({ default: m.BlogPostsPage })));
const MediaLibraryPage = lazy(() => import('./pages/MediaLibraryPage').then(m => ({ default: m.MediaLibraryPage })));
const PagesPage = lazy(() => import('./pages/PagesPage').then(m => ({ default: m.PagesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const RolesPage = lazy(() => import('./pages/RolesPage').then(m => ({ default: m.RolesPage })));
const PermalinksPage = lazy(() => import('./pages/PermalinksPage').then(m => ({ default: m.PermalinksPage })));

// ─── Error Boundary (M16 fix: defined at MODULE scope, not inside the render function) ───
class AdminContentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error) => React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

const DEV_BYPASS = import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';
const DEV_PROFILE = { email: 'admin@reframevisuals.com', role: 'admin', name: 'Dev Admin' };

export default function AdminLayout() {
  const { locked } = useAppLock();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Navigation and Auth profile
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const isTokenMissing = DEV_BYPASS ? false : (!token || token === 'null' || token === 'undefined');

  const { data: profileFromApi, isLoading: isProfileLoading, isError, error, isFetched, refetch } = useAuthProfile();
  const profile = DEV_BYPASS ? DEV_PROFILE : profileFromApi;
  
  const redirectToLogin = useCallback(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const loginPath = `/admin/login?redirect=${encodeURIComponent(currentPath || '/admin')}`;
    navigate(loginPath, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  // Immediate redirect if token is missing (before any fetch)
  useEffect(() => {
    if (isTokenMissing) {
      localStorage.removeItem('admin_token');
      redirectToLogin();
    }
  }, [isTokenMissing, redirectToLogin]);

  // If auth failed (no token / expired session), redirect to login immediately
  useEffect(() => {
    if (!DEV_BYPASS && isError) {
      localStorage.removeItem('admin_token');
      redirectToLogin();
    }
  }, [isError, error, redirectToLogin]);

  // After fetch completes with no profile and no error, also redirect (edge case)
  useEffect(() => {
    if (!DEV_BYPASS && isFetched && !profile && !isError && !isProfileLoading) {
      const token = localStorage.getItem('admin_token');
      if (!token || token === 'null' || token === 'undefined') {
        redirectToLogin();
      }
    }
  }, [isFetched, profile, isError, isProfileLoading, redirectToLogin]);

  // Robust loading timeout - if it takes > 15s, something is wrong with the server
  useEffect(() => {
    if (DEV_BYPASS) return;
    let timer: NodeJS.Timeout;
      if (!isFetched && !loadTimeout) {
        timer = setTimeout(() => {
        console.warn('[AdminLayout] Data fetch timed out after 15s');
        setLoadTimeout(true);
      }, 15000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isFetched, loadTimeout]);

  // Combined loading state — don't show spinner if auth error or if we're redirecting
  const isLoading = !DEV_BYPASS && (isProfileLoading || (!isFetched && !isTokenMissing)) && !loadTimeout && !isError;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle only connection timeouts in the error screen (auth errors redirect via useEffect above)
  if (loadTimeout) {
    return (
      <div className="an-admin-layout loading" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F7F6F3', color: '#1a1a1a', padding: '20px' }}>
        <div className="an-pulse-dot" style={{ background: '#ff4d4f' }} />
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Connection Timeout</h2>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.5 }}>
            The server is taking too long to respond. This might be due to a slow connection or a server-side issue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="an-btn an-btn-ghost an-btn-sm" 
            style={{ padding: '10px 20px', fontSize: '13px', background: '#fff', border: '1px solid #ddd' }}
            onClick={() => {
              setLoadTimeout(false);
              refetch();
            }}
          >
            Retry Connection
          </button>
          <button 
            className="an-btn an-btn-primary an-btn-sm" 
            style={{ padding: '10px 20px', fontSize: '13px', background: '#000', color: '#fff' }}
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              window.location.href = '/admin/login';
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Auth error or missing token: show nothing while navigating
  if (!DEV_BYPASS && (isError || isTokenMissing)) return null;

  // Still loading initially
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Initializing Dashboard</h2>
        <p className="text-gray-500 mb-8 max-w-xs text-center">
          Setting up your secure session and synchronizing platform data...
        </p>

        <button 
          onClick={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('adminToken'); // Clear legacy just in case
            window.location.href = '/admin/login';
          }}
          className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors py-2 px-4 border border-transparent hover:border-red-100 rounded-lg"
        >
          Clear Session & Logout
        </button>
      </div>
    );
  }

  const sidebarOpen = isMobile ? !sidebarCollapsed : true;

  const AdminRouteFallback = ({ error }: { error: Error }) => (
    <div className="flex h-full items-center justify-center bg-white p-6">
      <div className="w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-[16px] font-semibold text-red-700">Admin page failed to render</h2>
        <p className="mt-2 text-[13px] text-red-700/90">{error.message || 'Unexpected render error.'}</p>
        <div className="mt-3 flex gap-2">
          <button className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700" onClick={() => navigate('/admin/login', { replace: true })}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-container">
      <style>{`
        .admin-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #fff;
        }
        @media (max-width: 1024px) {
          .admin-shell {
            width: 100%;
          }
          .an-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 45;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
          }
          .an-sidebar-overlay.show {
            opacity: 1;
            pointer-events: auto;
          }
          .an-sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            width: min(86vw, 320px) !important;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 20px 0 50px rgba(0,0,0,0.1);
          }
          .an-sidebar.show {
            transform: translateX(0);
          }
        }
      `}</style>

      <div className={`an-sidebar-overlay ${sidebarOpen && isMobile ? 'show' : ''}`} onClick={() => setSidebarCollapsed(true)} />
      
      <div className="admin-shell" style={{ width: '100%', display: 'flex', height: '100vh' }}>
        {/* Use translateX instead of width transition to avoid layout recalculation per frame */}
        <div className={`an-sidebar-container ${sidebarOpen || !isMobile ? 'visible' : 'hidden'}`} style={{
          width: isMobile ? 0 : 'var(--an-sidebar-w)',
          flexShrink: 0,
          overflow: isMobile ? 'visible' : 'hidden',
          transform: !isMobile && sidebarCollapsed ? 'translateX(calc(-1 * var(--an-sidebar-w)))' : 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          marginRight: !isMobile && sidebarCollapsed ? 'calc(-1 * var(--an-sidebar-w))' : 0,
        }}>
          <AdminSidebar collapsed={sidebarCollapsed && !isMobile} mobileOpen={sidebarOpen && isMobile} onNavigate={() => isMobile && setSidebarCollapsed(true)} />
        </div>
        
        <div className="an-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <AdminHeader 
            profile={profile} 
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />
          <main className="an-content" style={{ flex: 1, overflowY: 'auto' }}>
            <AdminContentErrorBoundary fallback={(err) => <AdminRouteFallback error={err} />}>
              <Suspense fallback={
                <div style={{ height: 3, overflow: 'hidden', background: 'transparent' }}>
                  <div style={{ height: '100%', background: '#171717', animation: 'admin-route-progress 2s ease-in-out infinite' }} />
                  <style>{`@keyframes admin-route-progress { 0%{width:0} 40%{width:30%} 70%{width:60%} 100%{width:0} }`}</style>
                </div>
              }>
                <Routes>
                {/* Dashboard */}
                <Route index element={<DashboardHomePage />} />

                {/* Main */}
                <Route path="support" element={<SupportHubPage />} />
                <Route path="chats" element={<ChatsPage />} />
                <Route path="chats/:conversationId" element={<ChatsPage />} />
                <Route path="production" element={<ProductionPage />} />
                <Route path="production/:orderId" element={<ProductionOrderDetailPage />} />
                <Route path="production/:orderId/review" element={<AdminOrderReview />} />
                <Route path="custom-order" element={<AdminCustomOrder />} />

                {/* Business */}
                <Route path="leads" element={<LeadsPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/:customerId" element={<CustomersPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="deals" element={<DealsPage />} />

                {/* Marketing */}
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="automation" element={<AutomationPage />} />
                <Route path="landing-pages" element={<LandingPagesPage />} />

                {/* Quotes */}
                <Route path="quotations" element={<QuoteRequestsPage />} />
                <Route path="quotations/new" element={<QuoteBuilderPage />} />
                <Route path="quotebuilder" element={<QuoteBuilderPage />} />
                <Route path="templates" element={<QuoteTemplatesPage />} />

                {/* Content (CMS) */}
                <Route path="blog" element={<BlogPostsPage />} />
                <Route path="pages" element={<PagesPage />} />
                <Route path="media" element={<MediaLibraryPage />} />
                <Route path="permalinks" element={<PermalinksPage />} />

                {/* Users */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="roles" element={<RolesPage />} />

                {/* Platform */}
                <Route path="platform" element={<PlatformCustomizationPage />} />
                <Route path="cms" element={<CMSStoragePage />} />

                {/* Analytics */}
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="visitor-analytics" element={<VisitorAnalyticsPage />} />
                <Route path="reports" element={<ReportsPage />} />

                {/* Settings */}
                <Route path="team" element={<TeamPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="chatbot" element={<ChatbotConfigPage />} />

                {/* Extra pages */}
                <Route path="invoicing" element={<InvoicingPage />} />
                <Route path="payroll" element={<PayrollPage />} />
                <Route path="payouts" element={<PayoutDisbursementPage />} />
                <Route path="pricing" element={<PricingMatrixPage />} />
                <Route path="team-directory" element={<TeamDirectoryPage />} />
                <Route path="tasks" element={<TaskBoardPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="compliance" element={<CompliancePage />} />
                <Route path="quality" element={<QualityControlPage />} />
                <Route path="watchlist" element={<WatchlistPage />} />
                <Route path="nda" element={<NDAManagementPage />} />
                <Route path="styleguide" element={<StyleGuidePage />} />
                <Route path="discounts" element={<DiscountsPage />} />
                <Route path="assets" element={<AssetLibraryPage />} />
                <Route path="knowledge" element={<KnowledgeBasePage />} />
                <Route path="partnerships" element={<PartnershipsPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="meetings" element={<MeetingRequestsPage />} />
                <Route path="customer-dashboard" element={<CustomerDashboardPage />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </Suspense>
            </AdminContentErrorBoundary>
          </main>
        </div>
      </div>
      {locked ? <LockScreen /> : null}
    </div>
  );
}
