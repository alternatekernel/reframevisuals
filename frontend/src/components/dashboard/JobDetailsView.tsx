import React, { useEffect, useMemo, useState } from 'react';
import JobsListView from './JobsListView';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Download, RotateCcw, Eye, Clock, FileImage, Check, Loader2, Zap, X, ScanSearch, Paperclip } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useModal } from '../../context/ModalContext';
import { layout } from '../../utils/theme';
import ImageComparisonSlider from './ImageComparisonSlider';
import { JobImage } from '../../types/dashboard';
import { getApiEndpoint } from '../../lib/apiConfig';

interface ImageGridProps {
  images: JobImage[];
  placeholderCount: number;
  selectedAssetIds: string[];
  onInspect: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, placeholderCount, selectedAssetIds, onInspect, onToggleSelect }) => (
  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
    {images.map((img, index) => (
      <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-105">
        <button
          type="button"
          onClick={() => onInspect(img.id)}
          className="h-full w-full flex items-center justify-center bg-surfaceMuted focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
        >
          {img.afterUrl || img.url || img.beforeUrl ? (
            <img src={img.afterUrl || img.url || img.beforeUrl} alt={img.name || `Asset ${index + 1}`} className="h-full w-full object-cover" />
          ) : (
            <FileImage size={20} className="text-text-tertiary" />
          )}
          <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition-transform group-hover:translate-y-0">
            Inspect
          </span>
        </button>
        <button
          type="button"
          onClick={() => onToggleSelect(img.id)}
          className={`absolute right-1.5 top-1.5 h-5 w-5 rounded-full border text-[10px] font-bold transition-all ${
            selectedAssetIds.includes(img.id) ? 'border-brand-ink bg-brand-ink text-white' : 'border-white bg-white/90 text-transparent'
          }`}
          aria-label={selectedAssetIds.includes(img.id) ? 'Deselect asset' : 'Select asset'}
        >
          ✓
        </button>
      </div>
    ))}
    {Array.from({ length: placeholderCount }).map((_, index) => (
      <button
        key={`placeholder-${index}`}
        type="button"
        onClick={() => onInspect(`placeholder-${index}`)}
        className="group relative aspect-square rounded-lg flex items-center justify-center cursor-pointer bg-surfaceMuted hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
      >
        <FileImage size={20} className="text-text-tertiary" />
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition-transform group-hover:translate-y-0">
          Inspect
        </span>
      </button>
    ))}
  </div>
);

const JobDetailsView = () => {
  const { jobs, selectedJob, setSelectedJob, approveJob, requestRevision, rejectProposal, cancelJob, setCurrentView, fetchJobDetail } = useDashboard();
  const { showAlert, showConfirm } = useModal();
  const [downloading, setDownloading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [inspectingImageId, setInspectingImageId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [cancellingJob, setCancellingJob] = useState(false);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineNotes, setDeclineNotes] = useState('');
  const [submittingDecline, setSubmittingDecline] = useState(false);

  const handleRejectProposal = async () => {
    if (submittingDecline) return;
    const notes = declineNotes.trim();

    if (notes.length < 10) {
      showAlert({
        title: 'Add Details',
        message: 'Please explain what needs to change in the proposal or pricing.',
        variant: 'warning'
      });
      return;
    }

    setSubmittingDecline(true);
    try {
      await rejectProposal(job.id, notes);
      setShowDeclineModal(false);
      setDeclineNotes('');
      showAlert({
        title: 'Proposal Declined',
        message: 'Your feedback was sent to the account team. We moved this job back into review to adjust pricing.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Proposal decline error:', error);
      showAlert({
        title: 'Submit Failed',
        message: 'Could not submit proposal decline. Please try again.',
        variant: 'danger'
      });
    } finally {
      setSubmittingDecline(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirmed = await showConfirm({
      title: 'Cancel this order?',
      message: 'Uploaded files will be deleted and the order removed from your account. This cannot be undone.',
      confirmLabel: 'Yes, Cancel Order',
      variant: 'danger',
    });
    if (!confirmed) return;
    setCancellingJob(true);
    try {
      await cancelJob(job?.id || '');
    } catch {
      showAlert({ title: 'Cannot Cancel', message: 'This order cannot be cancelled at its current stage. Contact support if you need help.', variant: 'danger' });
    } finally {
      setCancellingJob(false);
    }
  };

  // Fetch full order detail (with all image fields) when this view mounts
  useEffect(() => {
    if (selectedJob?.id) {
      fetchJobDetail?.(selectedJob.id);
    }
  }, [selectedJob?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedJob) {
    return <JobsListView />;
  }

  const job = jobs.find(j => j.id === selectedJob.id) || selectedJob;
  const jobAny: any = job;
  const allImages = job.deliveredFiles?.length ? job.deliveredFiles : job.images || [];
  const mainImages = allImages.filter(img => !img.type || img.type === 'work');
  const supportImages = allImages.filter(img => img.type === 'support');
  const inspectionImages = allImages;
  const inspectingImage = inspectionImages.find(img => img.id === inspectingImageId) || null;
  const pricingAddons = useMemo(() => {
    const notes = (job as any).notes;
    if (!notes) return [] as Array<{label: string; price: number}>;
    try {
      const parsed = JSON.parse(notes);
      return Array.isArray(parsed?.addons) ? parsed.addons : [];
    } catch {
      return [];
    }
  }, [job]);

  const quotation = (job as any).quotation || {};
  const volume = Number((job as any).volume || job.imageCount || 0);
  const basePrice = Number(quotation.basePrice || quotation.basePricePerImage || 0);
  const subtotalBase = volume * basePrice;
  const addonsPerImage = pricingAddons.reduce((sum, addon: any) => sum + Number(addon.price || 0), 0);
  const addonsTotal = addonsPerImage * volume;
  const finalTotal = Number(quotation.totalPrice || subtotalBase + addonsTotal);
  const slaMultiplier = subtotalBase + addonsTotal > 0 ? finalTotal / (subtotalBase + addonsTotal) : 1;

  const isRevisionEligible = useMemo(() => {
    if (job.status === 'In Review') return true; // ready_qc — assets delivered, can request revision
    if (job.status === 'Complete') {
      const completedAt = job.completedAt;
      if (!completedAt) return false;
      const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
      return Date.now() - new Date(completedAt).getTime() < fourteenDaysInMs;
    }
    return false;
  }, [job]);

  const handleApprove = async () => {
    const confirmed = await showConfirm({
      title: 'Approve Assets?',
      message: 'By approving, you confirm these assets meet your requirements. This will finalize the project.',
      confirmLabel: 'Yes, Approve',
      variant: 'info'
    });

    if (confirmed) {
      await approveJob(job.id);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  const handleRequestRevision = async () => {
    if (submittingRevision) return;
    const notes = revisionNotes.trim();

    if (notes.length < 10) {
      showAlert({
        title: 'Add Revision Notes',
        message: 'Please describe what needs to change so the editing team can act on it.',
        variant: 'warning'
      });
      return;
    }

    setSubmittingRevision(true);
    try {
      await requestRevision(job.id, notes);
      setShowRevisionModal(false);
      setRevisionNotes('');
      showAlert({
        title: 'Revision Requested',
        message: 'Your notes were sent to the production team. We moved this job back into revision.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Revision request error:', error);
      showAlert({
        title: 'Revision Failed',
        message: 'Could not send your revision request. Please try again.',
        variant: 'danger'
      });
    } finally {
      setSubmittingRevision(false);
    }
  };

  const downloadAssets = async (assetIds?: string[]) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const query = assetIds?.length ? `?assetIds=${encodeURIComponent(assetIds.join(','))}` : '';
      // The request used to send only X-Guest-ID with no token and no cookies, so the
      // server resolved the caller as a guest and could never find the customer's
      // order — every download failed with "Failed to generate download".
      const token = localStorage.getItem('portal_token');
      const headers: Record<string, string> = {
        'X-Guest-ID': localStorage.getItem('portal_guest_id') || ''
      };
      if (token && token !== 'null') headers.Authorization = `Bearer ${token}`;

      const response = await fetch(getApiEndpoint(`/portal/orders/${job.id}/download${query}`), {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.message || `Download failed (${response.status})`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.code || 'assets'}${assetIds?.length ? '-selected' : ''}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      showAlert({
        title: 'Download Failed',
        message: (error as Error)?.message || 'Failed to generate download. Please try again.',
        variant: 'danger'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = () => downloadAssets();
  const handleDownloadSelected = () => downloadAssets(selectedAssetIds);
  const handleDiscussProposal = () => {
    setCurrentView?.('chat');
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => prev.includes(assetId)
      ? prev.filter(id => id !== assetId)
      : [...prev, assetId]
    );
  };

  return (
      <div className={layout.compactShell}>
        <header className="py-6 border-b border-borderSubtle">
          <div className="flex flex-wrap items-center gap-3">
            {/* Title row */}
            <div className="flex flex-1 items-center gap-4 min-w-0">
              <button onClick={() => setSelectedJob(null)} className="p-2 rounded-lg hover:bg-black/5 shrink-0">
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} className="text-text-secondary" />
              </button>
              <div className="min-w-0">
                <h1 className="text-[20px] font-semibold text-text-primary truncate">{job.name}</h1>
                <p className="text-[14px] text-text-secondary truncate">{job.services.join(', ')}</p>
              </div>
            </div>

            {/* Actions — wrap to next line on small screens */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {job.status === 'In Review' && (
                <>
                  <button
                    onClick={() => setShowRevisionModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-borderSubtle text-[13px] font-medium text-text-secondary hover:bg-black/[0.03] transition-all"
                  >
                    <RotateCcw size={15} />
                    Request Revision
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-green-700 transition-all"
                  >
                    <Check size={15} />
                    Approve Assets
                  </button>
                </>
              )}
              {job.status === 'Complete' && (
                <>
                  <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3 py-1.5">
                    <Check size={14} className="text-green-600" />
                    <span className="text-[13px] font-medium text-green-600">Finalized</span>
                  </div>
                  {isRevisionEligible && (
                    <button
                      onClick={() => setShowRevisionModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-borderSubtle text-[13px] font-medium text-text-secondary hover:bg-black/[0.03] transition-all"
                    >
                      <RotateCcw size={15} />
                      Request Revision
                    </button>
                  )}
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloading}
                    className="flex items-center gap-2 rounded-lg bg-brand-ink px-4 py-2 text-[13px] font-medium text-white transition-all disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {downloading ? 'Preparing ZIP...' : 'Download All'}
                  </button>
                </>
              )}
              {job.status === 'In Progress' && (
                <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-3 py-1.5">
                  <Clock size={14} className="text-amber-500" />
                  <span className="text-[13px] font-medium text-amber-500">Editing — {job.progress}%</span>
                </div>
              )}
              {job.status === 'Pending Approval' && (
                <div className="flex items-center gap-2 rounded-full bg-purple-50 border border-purple-100 px-3 py-1.5">
                  <Eye size={14} className="text-purple-600" />
                  <span className="text-[13px] font-medium text-purple-600">Awaiting Your Approval</span>
                </div>
              )}
              {job.status === 'Submitted' && (
                <div className="flex items-center gap-2 rounded-full bg-black/5 border border-black/[0.06] px-3 py-1.5">
                  <Clock size={14} className="text-black/40" />
                  <span className="text-[13px] font-medium text-black/50">In Queue</span>
                </div>
              )}
              {(job.status === 'Submitted' || job.status === 'Pending Approval') && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancellingJob}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {cancellingJob ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  {cancellingJob ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-green-900">Project Approved!</h4>
                  <p className="text-[13px] text-green-700">The assets have been finalized and added to your collection.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCelebration(false)}
                className="text-green-900/50 hover:text-green-900"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRevisionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setShowRevisionModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[18px] font-bold text-text-primary">Request a Revision</h3>
                    <p className="mt-1 text-[13px] text-text-secondary">
                      Tell the production team exactly what needs to change for {job.code || job.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRevisionModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-text-primary hover:bg-gray-200"
                    aria-label="Close revision request"
                  >
                    <X size={18} />
                  </button>
                </div>

                <textarea
                  value={revisionNotes}
                  onChange={(event) => setRevisionNotes(event.target.value)}
                  placeholder="Example: Please clean the reflection on image 04 and make the background pure white across the set."
                  className="h-36 w-full resize-none rounded-2xl border border-borderSubtle bg-surfaceMuted p-4 text-[14px] text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-text-primary/40 focus:bg-white focus:ring-1 focus:ring-black/5"
                />

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] text-text-secondary">Unlimited revisions are included with every job.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(false)}
                      className="rounded-xl border border-borderSubtle px-4 py-2 text-[13px] font-medium text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestRevision}
                      disabled={submittingRevision}
                      className="flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                    >
                      {submittingRevision ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                      {submittingRevision ? 'Sending...' : 'Send Revision'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeclineModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setShowDeclineModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[18px] font-bold text-text-primary">Decline Proposal & Request Changes</h3>
                    <p className="mt-1 text-[13px] text-text-secondary">
                      Let the team know what needs to be changed in this proposal (e.g. incorrect image volume, pricing adjustment, service correction).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-text-primary hover:bg-gray-200"
                    aria-label="Close decline modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <textarea
                  value={declineNotes}
                  onChange={(event) => setDeclineNotes(event.target.value)}
                  placeholder="Example: The volume count is wrong, it should be 10 images instead of 12. Also, I do not need color correction on this set."
                  className="h-36 w-full resize-none rounded-2xl border border-borderSubtle bg-surfaceMuted p-4 text-[14px] text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-text-primary/40 focus:bg-white focus:ring-1 focus:ring-black/5"
                />

                <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeclineModal(false)}
                      className="rounded-xl border border-borderSubtle px-4 py-2 text-[13px] font-medium text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectProposal}
                      disabled={submittingDecline}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {submittingDecline ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                      {submittingDecline ? 'Submitting...' : 'Decline Proposal'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {((job as any).quotation?.status === 'sent') && (
          <div className="my-6 rounded-2xl border border-borderSubtle bg-surfaceMuted p-5">
            <h3 className="text-[16px] font-bold text-text-primary mb-3">Pricing Proposal</h3>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between"><span>Retouching Service ({volume} × ${basePrice.toFixed(2)})</span><span>${subtotalBase.toFixed(2)}</span></div>
              {pricingAddons.map((addon: any, idx: number) => (
                <div key={`${addon.name || addon.label}-${idx}`} className="flex justify-between"><span>{addon.name || addon.label} ({volume} × ${Number(addon.price || 0).toFixed(2)})</span><span>${(volume * Number(addon.price || 0)).toFixed(2)}</span></div>
              ))}
              {slaMultiplier > 1.001 && (
                <div className="flex justify-between"><span>SLA Delivery Markup (x{slaMultiplier.toFixed(2)})</span><span>${(finalTotal - (subtotalBase + addonsTotal)).toFixed(2)}</span></div>
              )}
              <div className="mt-2 border-t border-borderSubtle pt-2 flex justify-between font-bold text-text-primary"><span>Final proposal total</span><span>${finalTotal.toFixed(2)}</span></div>
            </div>
            {(jobAny.description || '').includes('[Admin Note]:') && (
              <div className="mt-4 rounded-lg bg-white p-3 text-[13px] text-text-secondary">
                <span className="font-semibold text-text-primary">Admin Note: </span>
                {String(jobAny.description).split('[Admin Note]:')[1]?.trim() || ''}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={handleApprove} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-[14px] font-medium text-white">
                <Check size={16} /> Approve Breakdown & Start Edits
              </button>
              <button onClick={() => setShowDeclineModal(true)} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-red-700">
                <X size={16} /> Decline & Request Changes
              </button>
              <button onClick={handleDiscussProposal} className="rounded-lg border border-borderSubtle px-4 py-2 text-[14px] font-medium text-text-secondary">
                Discuss Proposal in Chat
              </button>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="py-8 border-b border-borderSubtle">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 z-0" />

            {[
              { id: 'Submitted',        label: 'Submitted',         icon: Clock      },
              { id: 'Pending Approval', label: 'Awaiting Approval', icon: Eye        },
              { id: 'In Progress',      label: 'In Progress',       icon: Loader2    },
              { id: 'In Revision',      label: 'Revision',          icon: RotateCcw  },
              { id: 'In Review',        label: 'In QC',             icon: Eye        },
              { id: 'Complete',         label: 'Done',              icon: Check      }
            ].map((step, idx) => {
              const statuses = ['Submitted', 'Pending Approval', 'In Progress', 'In Revision', 'In Review', 'Complete'];
              const currentIdx = statuses.indexOf(job.status) === -1 ? 0 : statuses.indexOf(job.status);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isPast ? 'bg-brand-ink text-white' :
                      isCurrent ? 'bg-brand-ink text-white ring-4 ring-black/5 scale-110' :
                      'bg-white border-2 border-gray-100 text-gray-300'
                    }`}
                  >
                    {isPast ? <Check size={18} /> : <step.icon size={18} className={isCurrent ? 'animate-pulse' : ''} />}
                  </div>
                  <span className={`text-[11px] font-bold mt-3 uppercase tracking-wider ${
                    isCurrent ? 'text-text-primary' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {(job.status === 'In Progress' || job.status === 'In Revision') && job.progress !== undefined && (
          <div className="py-6 border-b border-borderSubtle">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[13px] font-medium text-text-primary">Current Progress</span>
              <span className="text-[13px] font-bold text-text-primary">{job.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden bg-surfaceMuted">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${job.progress}%` }}
                className="h-full rounded-full bg-brand-ink"
              />
            </div>
          </div>
        )}

        <div className="py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-medium text-text-primary">
                {mainImages.length || job.imageCount} Main Image{(mainImages.length || job.imageCount) !== 1 ? 's' : ''}
              </h2>
              <p className="mt-1 text-[12px] text-text-secondary">
                Open any asset for A/B comparison and loupe inspection.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surfaceMuted px-3 py-1.5 text-[12px] font-medium text-text-primary">
              <ScanSearch size={14} />
              Premium inspection ready
            </div>
            {selectedAssetIds.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSelected}
                disabled={downloading}
                className="flex items-center gap-2 rounded-full bg-brand-ink px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download selected ({selectedAssetIds.length})
              </button>
            )}
          </div>
          <ImageGrid
            images={mainImages}
            placeholderCount={mainImages.length ? 0 : Math.max(1, Math.min(job.imageCount || 1, 8))}
            selectedAssetIds={selectedAssetIds}
            onInspect={setInspectingImageId}
            onToggleSelect={toggleAssetSelection}
          />

          {supportImages.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip size={14} className="text-text-secondary" />
                <h2 className="text-[14px] font-medium text-text-primary">
                  Support Images ({supportImages.length})
                </h2>
                <p className="text-[12px] text-text-muted">Reference / brief files provided with the order</p>
              </div>
              <ImageGrid
                images={supportImages}
                placeholderCount={0}
                selectedAssetIds={selectedAssetIds}
                onInspect={setInspectingImageId}
                onToggleSelect={toggleAssetSelection}
              />
            </div>
          )}
        </div>

        <AnimatePresence>
          {inspectingImageId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setInspectingImageId(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="w-full max-w-5xl rounded-3xl bg-white p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[16px] font-bold text-text-primary">
                      {inspectingImage?.name || 'Asset inspection'}
                    </h3>
                    <p className="text-[12px] text-text-secondary">
                      Drag the handle to compare before and after. Hover the image for loupe zoom.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectingImageId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-text-primary hover:bg-gray-200"
                    aria-label="Close inspection"
                  >
                    <X size={18} />
                  </button>
                </div>
                <ImageComparisonSlider
                  beforeUrl={inspectingImage?.beforeUrl || inspectingImage?.url}
                  afterUrl={inspectingImage?.afterUrl || inspectingImage?.url}
                  label={inspectingImage?.name || 'Asset'}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {(job.deliveryLink || job.deliveryNote) && (
          <div className="py-6 border-t border-borderSubtle">
            <h3 className="text-[12px] font-medium uppercase tracking-widest mb-3 text-text-tertiary">Delivery</h3>
            {job.deliveryNote && (
              <p className="mb-3 whitespace-pre-wrap text-[14px] leading-relaxed text-text-primary">{job.deliveryNote}</p>
            )}
            {job.deliveryLink && (
              <a
                href={job.deliveryLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-ink px-4 py-2 text-[14px] font-medium text-white"
              >
                <Download size={14} /> Open delivery link
              </a>
            )}
          </div>
        )}

        <div className="py-6 border-t border-borderSubtle">
          <h3 className="text-[12px] font-medium uppercase tracking-widest mb-3 text-text-tertiary">Your Instructions</h3>
          {job.description?.trim() ? (
            <p className="whitespace-pre-wrap rounded-lg bg-surfaceMuted px-3 py-2 text-[14px] leading-relaxed text-text-primary">
              {job.description}
            </p>
          ) : (
            <p className="text-[14px] text-text-tertiary">No instructions were added to this project.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 border-t border-borderSubtle">
          <div>
            <h3 className="text-[12px] font-medium uppercase tracking-widest mb-3 text-text-tertiary">Job Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[14px] text-text-secondary">Created</span>
                <span className="text-[14px] font-medium text-text-primary">{job.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-text-secondary">Images</span>
                <span className="text-[14px] font-medium text-text-primary">
                  {job.imageCount}
                  {/* When files come through a link, the billed volume and the number
                      of uploaded assets differ — show both so the count does not look
                      like assets went missing. */}
                  {job.customFilesLink && mainImages.length > 0 && job.imageCount !== mainImages.length && (
                    <span className="ml-1 text-[12px] font-normal text-text-tertiary">
                      ({mainImages.length} uploaded, rest via link)
                    </span>
                  )}
                </span>
              </div>
              {job.customFilesLink && (
                <div className="flex justify-between flex-col">
                  <span className="text-[14px] text-text-secondary mb-1">Source Link</span>
                  <a 
                    href={job.customFilesLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[14px] font-medium text-blue-600 hover:underline break-all text-left"
                  >
                    {job.customFilesLink}
                  </a>
                </div>
              )}
              {job.expectedCompletion && (
                <div className="flex justify-between">
                  <span className="text-[14px] text-text-secondary">Deadline</span>
                  <span className="text-[14px] font-medium text-text-primary">
                    {new Date(job.expectedCompletion).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[14px] text-text-secondary">Services</span>
                <span className="text-[14px] font-medium text-text-primary">{job.services.length}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[12px] font-medium uppercase tracking-widest mb-3 text-text-tertiary">Services Applied</h3>
            <div className="space-y-2">
              {job.services.map((svc, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-surfaceMuted px-3 py-2">
                  <Check size={14} style={{ color: '#16a34a' }} />
                  <span className="text-[14px] text-text-primary">{svc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default JobDetailsView;
