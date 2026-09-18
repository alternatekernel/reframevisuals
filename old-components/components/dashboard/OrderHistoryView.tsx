import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Job } from '../../types/dashboard';
import { layout } from '../../utils/theme';
import { useModal } from '../../context/ModalContext';
import { Download, Loader2, RotateCcw } from 'lucide-react';
import { dashboardInteractiveSurfaceClass } from './dashboard-primitives';
import { useNavigate } from 'react-router-dom';
import { portalFetch } from '../../lib/apiConfig';

const OrderHistoryView = () => {
  const { jobs, setSelectedJob, isLoading, setCurrentView } = useDashboard();
  const { showAlert } = useModal();
  const navigate = useNavigate();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const orderHistory = jobs.filter((job: Job) => job.status === 'Complete');

  const handleDownloadAll = async (jobId: string, jobCode: string) => {
    if (downloadingId) return;
    setDownloadingId(jobId);
    try {
      const response = await portalFetch(`/portal/orders/${jobId}/download`);

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.message || `Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${jobCode || 'assets'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      showAlert({
        title: 'Download Failed',
        message: 'Failed to generate download. Please try again.',
        variant: 'danger'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
        <header className="py-6 lg:py-8 border-b border-borderSubtle">
          <div className="h-8 w-48 bg-black/5 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-black/[0.03] rounded mt-2 animate-pulse" />
        </header>
        <div className="space-y-3 py-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full bg-black/[0.03] rounded-xl animate-pulse border border-black/5" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
      <header className="py-6 lg:py-8 border-b border-borderSubtle">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary" style={{ letterSpacing: '-1.12px' }}>Order History</h1>
        <p className="text-[14px] mt-1 text-text-secondary">{orderHistory.length} completed {orderHistory.length === 1 ? 'order' : 'orders'}</p>
      </header>

      {orderHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-bg-secondary border border-borderSubtle">
            <RotateCcw size={28} className="text-text-secondary" />
          </div>
          <h2 className="text-[20px] font-semibold text-text-primary">No completed orders yet</h2>
          <p className="text-[14px] mt-2 mb-8 text-text-secondary max-w-xs">
            Your finalized orders will appear here once a job is approved and closed.
          </p>
          <button
            onClick={() => { setCurrentView('orderFlow'); navigate('/dashboard?view=new-project'); }}
            className="flex items-center gap-2 rounded-full bg-text-primary text-white px-6 py-2.5 text-[13px] font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Place your first order
          </button>
        </div>
      ) : (
        <div className="space-y-3 py-6">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-text-muted">
            <div className="col-span-4">Job</div>
            <div className="col-span-2">Images</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {orderHistory.map((job: Job) => (
            <div key={job.id} className={`${dashboardInteractiveSurfaceClass} grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-12 md:items-center`}>
              <div className="md:col-span-4">
                <h3 className="text-[14px] font-medium text-text-primary">{job.name}</h3>
                <p className="text-[12px] mt-0.5 text-text-tertiary">{job.services.join(', ')}</p>
              </div>
              <div className="flex items-center justify-between md:col-span-2 md:block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary md:hidden">Images</span>
                <span className="text-[14px] text-text-secondary">{job.imageCount}</span>
              </div>
              <div className="flex items-center justify-between md:col-span-2 md:block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary md:hidden">Date</span>
                <span className="text-[14px] text-text-secondary">{job.date}</span>
              </div>
              <div className="flex items-center justify-between md:col-span-2 md:block">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary md:hidden">Total</span>
                <span className="text-[14px] font-semibold text-text-primary">{job.totalPrice || '—'}</span>
              </div>
              <div className="flex justify-end gap-2 border-t border-black/5 pt-3 md:col-span-2 md:border-t-0 md:pt-0">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="inline-flex items-center justify-center rounded-lg border border-borderSubtle px-4 py-2 text-[13px] font-medium text-text-secondary transition-all hover:bg-bg-secondary"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownloadAll(job.id, job.code || 'assets')}
                  disabled={downloadingId === job.id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-ink px-4 py-2 text-[13px] font-medium text-white transition-all disabled:opacity-50"
                >
                  {downloadingId === job.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {downloadingId === job.id ? 'Preparing...' : 'Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryView;
