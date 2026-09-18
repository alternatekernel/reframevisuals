import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Download, X, ChevronLeft, ChevronRight, Loader2, Search, ScanSearch } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { layout } from '../../utils/theme';
import { dashboardInputClass, dashboardPageDescriptionClass, dashboardPageTitleClass } from './dashboard-primitives';
import { JobImage } from '../../types/dashboard';
import { useModal } from '../../context/ModalContext';
import ImageComparisonSlider from './ImageComparisonSlider';

interface GalleryAsset extends JobImage {
  jobName: string;
  jobCode?: string;
  jobId: string;
}

const GalleryView = () => {
  const { jobs } = useDashboard();
  const { showAlert } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const allAssets = useMemo<GalleryAsset[]>(() => {
    return jobs
      .filter(j => j.status === 'Complete')
      .flatMap(j => {
        const images = j.deliveredFiles?.length ? j.deliveredFiles : j.images ?? [];
        return images
          .filter(img => !img.type || img.type === 'work')
          .map(img => ({ ...img, jobName: j.name, jobCode: j.code, jobId: j.id }));
      });
  }, [jobs]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return allAssets;
    const q = searchTerm.toLowerCase();
    return allAssets.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.jobName.toLowerCase().includes(q) ||
      a.jobCode?.toLowerCase().includes(q)
    );
  }, [allAssets, searchTerm]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIndex(i => (i !== null && i < filteredAssets.length - 1 ? i + 1 : i));

  const handleDownload = async (asset: GalleryAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = asset.afterUrl || asset.url || asset.beforeUrl;
    if (!url) return;

    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = asset.name || 'asset';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    } catch {
      showAlert({ title: 'Download Failed', message: 'Could not download this asset. Try again.', variant: 'danger' });
    } finally {
      setDownloading(false);
    }
  };

  const lightboxAsset = lightboxIndex !== null ? filteredAssets[lightboxIndex] : null;

  return (
    <div className={`${layout.compactShell} px-4 sm:px-6 xl:px-8`}>
      <header className="py-6 lg:py-8 border-b border-borderSubtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={dashboardPageTitleClass} style={{ letterSpacing: '-1.12px' }}>Gallery</h1>
            <p className={dashboardPageDescriptionClass}>
              All delivered assets across {jobs.filter(j => j.status === 'Complete').length} completed {jobs.filter(j => j.status === 'Complete').length === 1 ? 'job' : 'jobs'}
            </p>
          </div>
          {allAssets.length > 0 && (
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search by name or job..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`${dashboardInputClass} py-2 pl-9 pr-4`}
              />
            </div>
          )}
        </div>
      </header>

      {allAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-bg-secondary border border-borderSubtle">
            <Image size={28} className="text-text-secondary" />
          </div>
          <h2 className="text-[20px] font-semibold text-text-primary">No delivered assets yet</h2>
          <p className="text-[14px] mt-2 text-text-secondary max-w-xs">
            Finalized project assets will appear here once a job is approved and completed.
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] text-text-secondary">No assets matched "{searchTerm}"</p>
          <button onClick={() => setSearchTerm('')} className="mt-3 text-[13px] font-medium text-text-primary underline underline-offset-2">
            Clear search
          </button>
        </div>
      ) : (
        <>
          <p className="text-[12px] text-text-muted pt-5 pb-2 px-1">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
            {searchTerm ? ` matching "${searchTerm}"` : ''}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pb-10">
            {filteredAssets.map((asset, index) => {
              const imgUrl = asset.afterUrl || asset.url || asset.beforeUrl;
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4) }}
                  className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-bg-secondary border border-borderSubtle hover:border-black/20 transition-all"
                  onClick={() => openLightbox(index)}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={asset.name || `Asset ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Image size={20} className="text-text-tertiary" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                    <div className="text-white">
                      <ScanSearch size={14} />
                    </div>
                    <button
                      onClick={e => handleDownload(asset, e)}
                      className="text-white hover:scale-110 transition-transform"
                      aria-label="Download asset"
                    >
                      {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-5xl rounded-3xl bg-white p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-bold text-text-primary">
                    {lightboxAsset.name || 'Asset Inspection'}
                  </h3>
                  <p className="text-[12px] text-text-secondary">
                    {lightboxAsset.jobName}{lightboxAsset.jobCode ? ` · ${lightboxAsset.jobCode.toUpperCase()}` : ''} · {lightboxIndex + 1} of {filteredAssets.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => handleDownload(lightboxAsset, e)}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-borderSubtle text-[12px] font-medium text-text-secondary hover:bg-bg-secondary transition-all disabled:opacity-50"
                  >
                    {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Download
                  </button>
                  <button
                    onClick={closeLightbox}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-text-primary hover:bg-black/10 transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <ImageComparisonSlider
                beforeUrl={lightboxAsset.beforeUrl || lightboxAsset.url}
                afterUrl={lightboxAsset.afterUrl || lightboxAsset.url}
                label={lightboxAsset.name || 'Asset'}
              />

              {/* Prev / Next */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={goPrev}
                  disabled={lightboxIndex === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-borderSubtle text-[13px] font-medium text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <div className="flex gap-1">
                  {filteredAssets.slice(Math.max(0, lightboxIndex - 2), lightboxIndex + 3).map((_, rel) => {
                    const abs = Math.max(0, lightboxIndex - 2) + rel;
                    return (
                      <button
                        key={abs}
                        onClick={() => setLightboxIndex(abs)}
                        className={`w-2 h-2 rounded-full transition-all ${abs === lightboxIndex ? 'bg-brand-ink scale-125' : 'bg-black/15 hover:bg-black/30'}`}
                      />
                    );
                  })}
                </div>
                <button
                  onClick={goNext}
                  disabled={lightboxIndex === filteredAssets.length - 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-borderSubtle text-[13px] font-medium text-text-secondary hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryView;
