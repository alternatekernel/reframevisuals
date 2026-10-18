import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { adminFetch } from '../utils/api';

const colors = {
  bgPrimary: '#FFFFFF', bgSecondary: '#F7F7F5', bgTertiary: '#EFEFEF', bgHover: '#EAEAE5',
  textPrimary: '#37352F', textSecondary: '#787774', textTertiary: '#9B9A97',
  borderLight: '#E9E9E8', accentGreen: '#007A5A', accentOrange: '#FF9F2E', accentRed: '#FF3B30', accentBlue: '#0066FF',
};

interface QcImage {
  id: string;
  filename: string;
  rawUrl: string;
  editedUrl: string;
  status: string;
  qcPassed?: boolean | null;
  qcNotes?: string | null;
  editorName?: string;
}

export const QualityControlPage: React.FC = () => {
  const { showAlert } = useModal();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'review'>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [images, setImages] = useState<QcImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch('/operations/qc/dashboard');
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QC dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadBatchImages = async (batchId: string) => {
    setImagesLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ images: QcImage[] }>(`/operations/qc/batches/${batchId}/images`);
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QC images');
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleReviewBatch = async (batch: any) => {
    setSelectedBatch(batch);
    setActiveTab('review');
    await loadBatchImages(batch.id);
  };

  const handleApproveBatch = async () => {
    if (!selectedBatch) return;
    try {
      await adminFetch(`/operations/qc/batches/${selectedBatch.id}/approve`, { method: 'POST' });
      showAlert({ title: 'Success', message: 'Batch approved successfully!', variant: 'success' });
      setActiveTab('dashboard');
      setSelectedBatch(null);
      setImages([]);
      await loadDashboard();
    } catch (err) {
      showAlert({ title: 'Approval failed', message: err instanceof Error ? err.message : 'Could not approve batch', variant: 'danger' });
    }
  };

  const handleRejectBatch = () => {
    if (!selectedBatch) return;
    setRejectNotes('');
    setRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedBatch) return;
    setRejectModal(false);
    try {
      await adminFetch(`/operations/qc/batches/${selectedBatch.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: rejectNotes }),
      });
      showAlert({ title: 'Rejected', message: 'Batch rejected for revision.', variant: 'warning' });
      setActiveTab('dashboard');
      setSelectedBatch(null);
      setImages([]);
      await loadDashboard();
    } catch (err) {
      showAlert({ title: 'Rejection failed', message: err instanceof Error ? err.message : 'Could not reject batch', variant: 'danger' });
    }
  };

  if (activeTab === 'review' && selectedBatch) {
    return (
      <div className="p-4 max-w-[1400px] mx-auto">
        {/* Rejection reason modal */}
        {rejectModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setRejectModal(false)}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 460 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: colors.textPrimary }}>Reject batch — add reason</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>This note will be sent to the editor for revision.</div>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                autoFocus
                placeholder="e.g. Shadows too harsh on images 3–7. Please rebalance exposure."
                style={{ width: '100%', minHeight: 100, border: `1px solid ${colors.borderLight}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: colors.textPrimary, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button onClick={() => setRejectModal(false)} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: '#fff', cursor: 'pointer', fontSize: 14, color: colors.textPrimary }}>Cancel</button>
                <button onClick={confirmReject} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: colors.accentRed, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Confirm Rejection</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <button onClick={() => { setActiveTab('dashboard'); setSelectedBatch(null); setImages([]); }} className="text-[15px] text-blue-600 hover:underline mb-1">← Back to Dashboard</button>
            <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Review Batch: {selectedBatch.orderCode}</h1>
            <p className="text-[14px]" style={{ color: colors.textTertiary }}>{selectedBatch.customer} • {selectedBatch.totalImages} images</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadBatchImages(selectedBatch.id)} className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2 border" style={{ borderColor: colors.borderLight, color: colors.textPrimary }}><RefreshCw size={16} className={imagesLoading ? 'animate-spin' : ''} /> Refresh</button>
            <button onClick={handleRejectBatch} className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2" style={{ background: colors.accentRed, color: '#FFF' }}><XCircle size={16} /> Request Revision</button>
            <button onClick={handleApproveBatch} className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2" style={{ background: colors.accentGreen, color: '#FFF' }}><CheckCircle size={16} /> Approve Batch</button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</div>}

        {imagesLoading ? (
          <div className="p-10 text-center" style={{ color: colors.textSecondary }}>Loading review images...</div>
        ) : images.length === 0 ? (
          <div className="rounded-md border p-10 text-center" style={{ borderColor: colors.borderLight, color: colors.textSecondary }}>No images found for this batch.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {images.map((image) => {
              const statusLabel = image.qcPassed === true ? 'Passed' : image.qcPassed === false ? 'Failed' : image.status || 'Pending';
              const statusClass = image.qcPassed === true ? 'bg-green-100 text-green-700' : image.qcPassed === false ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
              return (
                <div key={image.id} className="rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                    <div className="aspect-video bg-gray-100 relative">
                      <img src={image.rawUrl} alt={`Raw ${image.filename}`} className="w-full h-full object-cover" />
                      <span className="absolute left-2 top-2 text-[11px] px-2 py-1 rounded bg-black/70 text-white">RAW</span>
                    </div>
                    <div className="aspect-video bg-gray-100 relative">
                      <img src={image.editedUrl} alt={`Edited ${image.filename}`} className="w-full h-full object-cover" />
                      <span className="absolute left-2 top-2 text-[11px] px-2 py-1 rounded bg-black/70 text-white">EDITED</span>
                      <span className={`absolute right-2 top-2 text-[12px] px-2 py-1 rounded ${statusClass}`}>{statusLabel}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[14px] font-medium mb-1" style={{ color: colors.textPrimary }}>{image.filename}</div>
                    <div className="text-[12px] mb-2" style={{ color: colors.textTertiary }}>Editor: {image.editorName || 'N/A'}</div>
                    {image.qcNotes && <div className="text-[12px] mb-2 rounded bg-orange-50 p-2 text-orange-700">{image.qcNotes}</div>}
                    <div className="flex items-center justify-between">
                      <a href={image.editedUrl} target="_blank" rel="noreferrer" className="text-[14px] flex items-center gap-1 hover:underline" style={{ color: colors.accentBlue }}><Eye size={12} /> Open Edited</a>
                      <a href={image.rawUrl} target="_blank" rel="noreferrer" className="text-[14px] hover:underline" style={{ color: colors.textSecondary }}>Raw file</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Quality Control</h1>
          <p className="text-[14px]" style={{ color: colors.textTertiary }}>Batch review and approval workflow</p>
        </div>
        <button onClick={loadDashboard} className="px-4 py-2 text-[15px] font-medium rounded-md flex items-center gap-2 border" style={{ borderColor: colors.borderLight, color: colors.textPrimary }}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}><div className="flex items-center gap-2 mb-2"><Clock size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Pending Review</span></div><div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{dashboard?.metrics.batchesPending || 0}</div></div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}><div className="flex items-center gap-2 mb-2"><Eye size={16} style={{ color: colors.textSecondary }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>In Review</span></div><div className="text-[24px] font-semibold" style={{ color: colors.textPrimary }}>{dashboard?.metrics.batchesInReview || 0}</div></div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}><div className="flex items-center gap-2 mb-2"><CheckCircle size={16} style={{ color: colors.accentGreen }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>First Pass Rate</span></div><div className="text-[24px] font-semibold" style={{ color: colors.accentGreen }}>{dashboard?.metrics.firstPassRate || 0}%</div></div>
        <div className="p-4 rounded-md border" style={{ background: colors.bgPrimary, borderColor: colors.borderLight }}><div className="flex items-center gap-2 mb-2"><AlertCircle size={16} style={{ color: colors.accentRed }} /><span className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>Rejection Rate</span></div><div className="text-[24px] font-semibold" style={{ color: colors.accentRed }}>{dashboard?.metrics.rejectionRate || 0}%</div></div>
      </div>

      {loading ? (
        <div className="p-10 text-center" style={{ color: colors.textSecondary }}>Loading QC dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.borderLight }}><h3 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Pending Batches</h3></div>
            <div className="divide-y" style={{ borderColor: colors.borderLight }}>
              {dashboard?.pendingBatches?.length ? dashboard.pendingBatches.map((batch: any) => (
                <div key={batch.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div><div className="text-[15px] font-medium" style={{ color: colors.textPrimary }}>{batch.orderCode}</div><div className="text-[14px]" style={{ color: colors.textTertiary }}>{batch.customer} • {batch.totalImages} images</div></div>
                  <div className="flex items-center gap-3"><span className={`text-[14px] px-2 py-1 rounded capitalize ${batch.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{batch.priority}</span><button onClick={() => handleReviewBatch(batch)} className="px-3 py-1.5 text-[14px] font-medium rounded-md" style={{ background: colors.textPrimary, color: '#FFF' }}>Review</button></div>
                </div>
              )) : <div className="p-8 text-center text-[14px]" style={{ color: colors.textSecondary }}>No pending QC batches.</div>}
            </div>
          </div>

          <div className="rounded-md border overflow-hidden" style={{ borderColor: colors.borderLight, background: colors.bgPrimary }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: colors.borderLight }}><h3 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>Top Rejection Reasons</h3></div>
            <div className="p-4 space-y-3">
              {(() => {
                const reasons = dashboard?.rejectionReasons || [];
                const maxCount = reasons.reduce((m: number, r: any) => Math.max(m, r.count), 1);
                return reasons.map((reason: any, i: number) => (
                  <div key={i}><div className="flex items-center justify-between mb-1"><span className="text-[14px]" style={{ color: colors.textSecondary }}>{reason.reason}</span><span className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{reason.count}</span></div><div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (reason.count / maxCount) * 100)}%`, background: colors.accentRed }} /></div></div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
