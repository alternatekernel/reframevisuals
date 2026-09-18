import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Image, MoreHorizontal, Search, Download, Loader2, Eye, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { STATUS_CONFIG, Job } from '../../types/dashboard';
import { portalFetch } from '../../lib/apiConfig';
import { layout } from '../../utils/theme';
import { dashboardInputClass, dashboardPanelClass, dashboardInteractiveSurfaceClass, dashboardMetricLabelClass, dashboardMetricValueClass, dashboardPageDescriptionClass, dashboardPageTitleClass } from './dashboard-primitives';
import { ActivityFeed } from './StatsWidgets';
import { useModal } from '../../context/ModalContext';

type FilterTab = 'All' | 'Active' | 'Completed';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'images-desc';

const JobsListView = () => {
  const { jobs, stats, setSelectedJob, setCurrentView, isLoading } = useDashboard();
  const { showAlert } = useModal();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadAll = async (jobId: string, jobCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const filteredJobs = jobs
    .filter((job: Job) => {
      // Status filtering
      const matchesTab = 
        activeTab === 'All' || 
        (activeTab === 'Active' && (job.status === 'In Progress' || job.status === 'In Review' || job.status === 'Pending Approval' || job.status === 'Submitted')) ||
        (activeTab === 'Completed' && job.status === 'Complete');
      
      // Search filtering
      const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.services.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => {
      // Sorting logic
      if (sortBy === 'date-desc') return new Date(b.createdAtRaw || b.date).getTime() - new Date(a.createdAtRaw || a.date).getTime();
      if (sortBy === 'date-asc')  return new Date(a.createdAtRaw || a.date).getTime() - new Date(b.createdAtRaw || b.date).getTime();
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'images-desc') return b.imageCount - a.imageCount;
      return 0;
    });
  const hasAnyJobs = jobs.length > 0;

  if (isLoading && jobs.length === 0) {
    return (
      <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
        <header className="py-6 lg:py-8 border-b border-[var(--color-border-subtle)]">
          <div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="h-4 w-full max-w-64 bg-gray-50 rounded mt-2 animate-pulse" style={{ animationDelay: '100ms' }} />
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 py-6 border-b border-borderSubtle">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="space-y-3 py-8">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 w-full bg-gray-50/50 rounded-xl animate-pulse border border-gray-100" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
      <header className="py-6 lg:py-8 border-b border-[var(--color-border-subtle)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={dashboardPageTitleClass} style={{ letterSpacing: '-1.12px' }}>
              Jobs
            </h1>
            <p className={dashboardPageDescriptionClass}>
              Manage your image editing jobs
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 py-5 lg:py-6 border-b border-borderSubtle">
        <div>
          <p className={dashboardMetricLabelClass}>Total</p>
          <p className={dashboardMetricValueClass} style={{ letterSpacing: '-1.12px' }}>{stats.total}</p>
        </div>
        <div>
          <p className={dashboardMetricLabelClass}>Active</p>
          <p className={dashboardMetricValueClass} style={{ letterSpacing: '-1.12px' }}>{stats.active}</p>
        </div>
        <div>
          <p className={dashboardMetricLabelClass}>Completed</p>
          <p className={dashboardMetricValueClass} style={{ letterSpacing: '-1.12px' }}>{stats.completed}</p>
        </div>
        <div>
          <p className={dashboardMetricLabelClass}>Images</p>
          <p className={dashboardMetricValueClass} style={{ letterSpacing: '-1.12px' }}>{stats.images}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 xl:gap-8 py-6 lg:py-8">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {hasAnyJobs && (
          <div className="flex flex-col gap-3 pb-4">
            <div className="flex items-center gap-1 bg-bg-secondary/50 p-1 rounded-xl w-full md:w-auto">
              {(['All', 'Active', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 md:flex-none px-4 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium transition-all ${activeTab === tab ? 'text-text-primary' : 'text-text-secondary'}`}
                  style={{
                    backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input 
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${dashboardInputClass} py-2 pl-9 pr-4`}
                />
              </div>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`${dashboardInputClass} cursor-pointer py-2 text-[13px] font-medium hover:bg-bg-secondary`}
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="name-asc">A-Z Name</option>
                <option value="images-desc">Most Images</option>
              </select>
            </div>
          </div>
          )}

          {filteredJobs.length > 0 ? (
            <div className="space-y-2">
              <div className={`hidden md:grid grid-cols-12 gap-3 px-4 py-3 ${dashboardMetricLabelClass}`}>
                <div className="col-span-4">Job</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Images</div>
                <div className="col-span-3">Details</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {filteredJobs.map((job: Job, index: number) => {
                const statusConfig = STATUS_CONFIG[job.status];
                
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${dashboardInteractiveSurfaceClass} group grid cursor-pointer grid-cols-1 gap-3 px-4 py-4 hover:bg-bg-secondary md:grid-cols-12 md:items-center`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="md:col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-bg-secondary">
                          <Image size={18} className="text-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[14px] font-medium truncate text-text-primary">{job.name}</h3>
                            {job.isPriority && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
                          </div>
                          <p className="text-[12px] mt-0.5 truncate text-text-muted">
                            {job.services.length > 0 ? job.services.slice(0, 2).join(', ') + (job.services.length > 2 ? ` +${job.services.length - 2}` : '') : 'No services'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:col-span-2 md:block">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted md:hidden">Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig.color }} />
                        <span className="text-[12px] font-medium" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:col-span-2 md:block">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted md:hidden">Images</span>
                      <p className="text-[14px] font-medium text-text-primary">{job.imageCount}</p>
                    </div>

                    <div className="flex items-center justify-between md:col-span-3 md:block">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted md:hidden">Details</span>
                      <div className="space-y-0.5">
                        {job.code && <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{job.code}</p>}
                        <p className="text-[12px] text-text-muted">{job.date}</p>
                        {job.totalPrice
                          ? <p className="text-[12px] font-semibold text-text-primary">{job.totalPrice}</p>
                          : <p className="text-[12px] text-text-muted italic">Pending quote</p>
                        }
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-black/5 pt-3 md:col-span-1 md:border-t-0 md:pt-0">
                      {job.status === 'Complete' && (
                        <button
                          className="p-2 rounded-lg flex items-center justify-center transition-all bg-gray-100 hover:bg-gray-200"
                          onClick={(e) => handleDownloadAll(job.id, job.code || 'assets', e)}
                          disabled={downloadingId === job.id}
                          title="Download All Assets"
                        >
                          {downloadingId === job.id ? (
                            <Loader2 size={16} className="animate-spin text-black" />
                          ) : (
                            <Download size={16} className="text-text-primary" />
                          )}
                        </button>
                      )}
                      <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className={`${dashboardPanelClass} flex flex-col items-center justify-center py-20 text-center`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Plus size={32} className="text-text-primary" />
              </div>
              <h2 className="text-[20px] font-semibold text-text-primary">No jobs yet</h2>
              <p className="text-[14px] mt-2 mb-8 text-text-secondary">
                {hasAnyJobs ? 'No jobs matched your current filters.' : 'Create your first job to get started.'}
              </p>
              <button
                onClick={() => setCurrentView('orderFlow')}
                className="group relative overflow-hidden rounded-full px-6 py-2.5 text-[13px] font-medium transition-all bg-text-primary text-white flex items-center gap-2"
              >
                <Plus size={16} />
                {hasAnyJobs ? 'Create New Job' : 'Create First Job'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Insights */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <ActivityFeed />
          
          <div className="p-6 rounded-2xl bg-text-primary text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-[14px] font-semibold mb-2">Pro Tip</h4>
              <p className="text-[12px] text-white/60 leading-relaxed mb-4">
                Set up auto-sync with Dropbox to receive your retouched images directly to your cloud storage when a job completes.
              </p>
              <button
                onClick={() => setCurrentView('account')}
                className="text-[12px] font-medium flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                Go to Integrations <ArrowRight size={14} />
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsListView;
