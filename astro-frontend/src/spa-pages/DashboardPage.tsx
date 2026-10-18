import { useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useDashboard,
  DashboardLayout,
  JobsListView,
  JobDetailsView,
  OrderHistoryView,
  BillingView,
  AccountView,
  ChatView,
  OrderFlowView,
  GalleryView
} from '../components/dashboard';

const DashboardRouter = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentView, setCurrentView, selectedJob } = useDashboard();
  
  const path = location.pathname;
  const viewParam = searchParams.get('view');

  // Sync route and params with view state (selectedJob intentionally excluded — it's
  // managed independently and including it creates a setState loop when navigating back)
  useEffect(() => {
    if (viewParam === 'chat') {
      setCurrentView('chat');
    } else if (viewParam === 'new-project') {
      setCurrentView('orderFlow');
    } else if (path.includes('orders')) {
      setCurrentView('orders');
    } else if (path.includes('billing')) {
      setCurrentView('billing');
    } else if (path.includes('account')) {
      setCurrentView('account');
    } else if (path.includes('gallery')) {
      setCurrentView('gallery');
    } else if (path === '/dashboard' && !viewParam) {
      setCurrentView('jobs');
    }
  }, [path, viewParam, setCurrentView]);

  const renderView = () => {
    if (currentView === 'chat') return <ChatView />;
    if (currentView === 'billing') return <BillingView />;
    if (currentView === 'account') return <AccountView />;
    if (currentView === 'orderFlow') return <OrderFlowView />;
    if (currentView === 'gallery') return <GalleryView />;

    // If a job is selected, show details regardless of being in 'jobs' or 'orders' view
    if (selectedJob) return <JobDetailsView />;

    if (currentView === 'orders') return <OrderHistoryView />;
    return <JobsListView />;
  };

  const getDashboardKey = () => {
    if (selectedJob) return `job-${selectedJob.id || 'details'}`;
    return currentView;
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={getDashboardKey()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
            className="flex-grow flex flex-col min-h-0"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

const DashboardPage = () => {
  return (
    <DashboardRouter />
  );
};

export default DashboardPage;