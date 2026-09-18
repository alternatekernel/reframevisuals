import { ReactNode, useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useDashboard } from '../../context/DashboardContext';
import { useContent } from '../../context/ContentBase';
import { ONBOARDING_KEY } from './OnboardingOverlay';
import { portalApi } from '../../services/portalApi';
const OnboardingOverlay = lazy(() => import('./OnboardingOverlay'));

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { jobs, isLoading } = useDashboard();
  const { isAuthenticated, currentUser } = useContent();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isLoading || !currentUser?.id) return;
    const userOnboardingKey = `reframe_onboarding_done_${currentUser.id}`;
    const localDone = localStorage.getItem(userOnboardingKey) === '1' || localStorage.getItem(ONBOARDING_KEY) === '1';
    const serverDone = !!currentUser.onboardingCompleted;

    if (!localDone && !serverDone && isAuthenticated && !currentUser?.isGuest && jobs.length === 0) {
      setShowOnboarding(true);
    }
  }, [isLoading, isAuthenticated, currentUser?.isGuest, currentUser?.id, currentUser?.onboardingCompleted, jobs.length]);

  return (
    <div className="min-h-[100dvh] bg-white font-satoshi selection:bg-brand-ink/10 antialiased">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/[0.06] bg-white/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-text-primary active:scale-95"
          aria-label="Open dashboard menu"
        >
          <Menu size={20} />
        </button>
        <div className="text-[13px] font-bold tracking-[-0.02em] text-text-primary">Reframe CS</div>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close dashboard menu overlay"
          />
          <aside
            className="absolute bottom-0 left-0 top-0 w-[min(86vw,320px)] overflow-y-auto bg-[#FAFAFA] shadow-2xl pb-[max(env(safe-area-inset-bottom),1rem)]"
            style={{ boxShadow: 'inset -1px 0px 0px 0px rgba(0,0,0,0.04), 24px 0px 60px rgba(0,0,0,0.18)' }}
          >
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-text-primary shadow-sm"
              aria-label="Close dashboard menu"
            >
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <AnimatePresence>
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingOverlay onDismiss={async () => {
              if (currentUser?.id) {
                localStorage.setItem(`reframe_onboarding_done_${currentUser.id}`, '1');
                try {
                  await portalApi.updateProfile({ onboardingCompleted: true });
                  currentUser.onboardingCompleted = true;
                } catch (err) {
                  console.error('Failed to save onboarding status to server:', err);
                }
              }
              setShowOnboarding(false);
            }} />
          </Suspense>
        )}
      </AnimatePresence>

      <div className="flex min-h-[calc(100dvh-56px)] lg:min-h-screen">
      <aside 
        className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 shrink-0 overflow-y-auto bg-[#FAFAFA] lg:block"
        style={{ boxShadow: 'inset -1px 0px 0px 0px rgba(0,0,0,0.04), 1px 0px 0px 0px rgba(0,0,0,0.06)' }}
      >
        <Sidebar />
      </aside>
      <main className="relative min-h-[calc(100dvh-56px)] min-w-0 flex-1 lg:min-h-screen lg:pl-64">
        <div className="h-full">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
