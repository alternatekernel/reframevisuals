import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Clock, Sparkles, CreditCard, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import FreeTrialSuccess from '../sections/freetrial/FreeTrialSuccess';
import { cx } from '../utils/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_FILES = 3;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

interface FileWithPreview {
  file: File;
  preview: string;
}

type UploadStage = 'idle' | 'uploading' | 'done' | 'error';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TRUST_ITEMS = [
  { icon: Clock, label: '24h turnaround' },
  { icon: Sparkles, label: '3 edits free' },
  { icon: CreditCard, label: 'No credit card' },
  { icon: ShieldCheck, label: 'Files kept private' },
];

const StartPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectAssetsRef = useRef<FileWithPreview[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: new URLSearchParams(window.location.search).get('email') || '',
    instructions: '',
    sourceLink: '',
  });
  const [projectAssets, setProjectAssets] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');
  const [rejectedFileNames, setRejectedFileNames] = useState<string[]>([]);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');

  useEffect(() => {
    projectAssetsRef.current = projectAssets;
  }, [projectAssets]);

  useEffect(() => {
    return () => {
      projectAssetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.preview));
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_FILE_SIZE);
    const invalid = files.filter((f) => !(f.type.startsWith('image/') && f.size <= MAX_FILE_SIZE));
    const incoming = valid.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));

    setProjectAssets(prev => {
      const availableSlots = Math.max(MAX_FILES - prev.length, 0);
      const accepted = incoming.slice(0, availableSlots);
      const overflow = incoming.slice(availableSlots);
      overflow.forEach(asset => URL.revokeObjectURL(asset.preview));

      const rejected = [...invalid.map(f => f.name), ...overflow.map(a => a.file.name)];
      setRejectedFileNames(rejected);
      if (overflow.length > 0 && invalid.length > 0) {
        setUploadNotice('Free sample allows up to 3 images (max 15MB each, image files only). Some files were not added.');
      } else if (overflow.length > 0) {
        setUploadNotice('Free sample allows up to 3 images. Extra files were not added.');
      } else if (invalid.length > 0) {
        setUploadNotice('Only image files up to 15MB are accepted. Some files were not added.');
      } else {
        setUploadNotice('');
      }
      return [...prev, ...accepted];
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = useCallback((index: number) => {
    setProjectAssets(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      if (updated.length < MAX_FILES) {
        setUploadNotice('');
        setRejectedFileNames([]);
      }
      return updated;
    });
  }, []);

  const isFormValid =
    projectAssets.length > 0 &&
    formData.name.trim() !== '' &&
    EMAIL_REGEX.test(formData.email);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');
    setUploadStage('uploading');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      // Whatever the client typed is the brief. Without this the editor received a
      // trial with no instructions at all.
      formDataToSend.append(
        'description',
        formData.instructions.trim() || 'Instant drop-zone submission (/start)'
      );
      if (formData.sourceLink.trim()) {
        formDataToSend.append('sourceLink', formData.sourceLink.trim());
      }
      projectAssets.forEach((asset) => formDataToSend.append('files', asset.file));

      const response = await fetch('/api/portal/freetrial', {
        method: 'POST',
        body: formDataToSend,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const result = isJson ? await response.json() : null;

      if (!response.ok) {
        const fallbackText = !isJson ? await response.text() : '';
        const msg = result?.message || fallbackText || `Submission failed (${response.status})`;
        throw new Error(msg);
      }

      if (result?.success && result?.token) {
        localStorage.setItem('portal_token', result.token);
        localStorage.setItem('portal_user', JSON.stringify(result.user));
        localStorage.setItem('reframe_cs_welcome_trigger', 'true');
        setUploadStage('done');
        setSubmitted(true);
        return;
      }

      throw new Error(result?.message || 'Submission failed');
    } catch (error: any) {
      console.error('Failed to submit free trial:', error);
      setUploadStage('error');
      setSubmitError(error?.message || 'Unable to submit your free trial. Please try again or email us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <FreeTrialSuccess onBack={() => navigate('/')} />;
  }

  const hasFiles = projectAssets.length > 0;

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white relative overflow-hidden flex flex-col">
      <Helmet>
        <title>Drop Your Photos — Get 3 Edited Free | Reframe Visuals</title>
        <meta name="description" content="Drag in up to 3 product photos and get them professionally edited free within 24 hours. No credit card, no forms — just drop and go." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[120px] right-[-80px] w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-orange-100/30 to-amber-100/20 blur-[90px] opacity-70" />
        <div className="absolute bottom-[40px] left-[-60px] w-[320px] h-[320px] rounded-full bg-gradient-to-br from-emerald-100/15 to-teal-100/15 blur-[90px] opacity-70" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8">
        <div className="w-full max-w-3xl text-center space-y-3 mb-6 sm:mb-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Instant Free Trial</h3>
          <h1 className="text-[32px] sm:text-[44px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.08]">
            Drop your product photos.<br className="hidden sm:block" /> Get 3 edited free.
          </h1>
          <p className="text-[15px] sm:text-[17px] text-black/55 leading-relaxed max-w-xl mx-auto">
            No forms, no calls. Drag your images below and our lead editors send them back polished within 24 hours.
          </p>
        </div>

        <div className="w-full max-w-3xl">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => { if (!hasFiles) fileInputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !hasFiles) { e.preventDefault(); fileInputRef.current?.click(); } }}
            aria-label="Upload up to 3 product images"
            className={cx(
              'relative rounded-[24px] border-2 border-dashed transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-black/30',
              isDragging
                ? 'border-[var(--brand)] bg-orange-50/40 scale-[0.995] shadow-[0_14px_40px_rgba(233,116,81,0.12)]'
                : 'border-black/15 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.05)]',
              !hasFiles && 'cursor-pointer hover:border-black/40 hover:bg-black/[0.01]'
            )}
          >
            {!hasFiles ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 sm:py-24 text-center">
                <div className={cx(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                  isDragging ? 'bg-black text-white' : 'bg-black/[0.04] text-black/60'
                )}>
                  <Upload size={26} />
                </div>
                <div>
                  <p className="text-[17px] sm:text-[19px] font-bold text-[var(--color-text-primary)]">
                    {isDragging ? 'Release to add your images' : 'Drag up to 3 images here'}
                  </p>
                  <p className="mt-1 text-[13px] text-black/50">
                    or <span className="text-black font-semibold underline underline-offset-4">browse your files</span> · JPG, PNG, WEBP · up to 15MB each
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {projectAssets.map((asset, i) => (
                    <div key={`${asset.file.name}-${i}`} className="relative group rounded-2xl overflow-hidden border border-black/10 bg-black/[0.02] aspect-square">
                      <img src={asset.preview} alt={asset.file.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        aria-label={`Remove ${asset.file.name}`}
                        className="absolute top-2 right-2 p-1.5 bg-white text-black rounded-full border border-black/10 shadow-sm hover:bg-black hover:text-white transition-all"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6">
                        <p className="text-[10px] font-medium text-white truncate">{asset.file.name} · {formatFileSize(asset.file.size)}</p>
                      </div>
                    </div>
                  ))}
                  {projectAssets.length < MAX_FILES && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 aspect-square text-black/50 hover:border-black hover:text-black hover:bg-black/[0.01] transition-all"
                    >
                      <Plus size={20} />
                      <span className="text-[12px] font-semibold">Add more</span>
                      <span className="text-[10px] text-black/40">{MAX_FILES - projectAssets.length} slot{MAX_FILES - projectAssets.length === 1 ? '' : 's'} left</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {uploadNotice && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
              <div className="flex items-start gap-2 font-semibold"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{uploadNotice}</div>
              {rejectedFileNames.length > 0 && <p className="mt-1 text-[11px]">Not added: {rejectedFileNames.join(', ')}</p>}
            </div>
          )}

          {hasFiles && (
            <form onSubmit={handleSubmit} noValidate className="mt-4 rounded-[20px] border border-black/10 bg-[var(--color-bg-secondary)] p-4 sm:p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
              <p className="text-[13px] font-bold text-[var(--color-text-primary)] mb-3">
                Last step — where do we send your edited images?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  aria-label="Full name"
                  required
                  className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Work email"
                  aria-label="Work email"
                  required
                  className="flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                />
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] px-7 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? 'Uploading...' : 'Get my free edits'}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Editing instructions — background, shadows, colour, anything specific (optional)"
                  aria-label="Editing instructions"
                  rows={3}
                  maxLength={4000}
                  className="w-full resize-y rounded-[20px] border border-black/10 bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                />
                <input
                  type="url"
                  value={formData.sourceLink}
                  onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                  placeholder="Drive / Dropbox / WeTransfer link to more files (optional)"
                  aria-label="Link to additional files"
                  className="w-full rounded-full border border-black/10 bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                />
              </div>

              {uploadStage !== 'idle' && (
                <div className={cx('mt-3 p-3.5 rounded-xl border text-[13px] font-semibold',
                  uploadStage === 'uploading' && 'bg-blue-50 text-blue-700 border-blue-100',
                  uploadStage === 'done' && 'bg-green-50 text-green-700 border-green-100',
                  uploadStage === 'error' && 'bg-red-50 text-red-600 border-red-100'
                )}>
                  {uploadStage === 'uploading' && 'Uploading your images...'}
                  {uploadStage === 'done' && 'Upload done. Your sample request has been received.'}
                  {uploadStage === 'error' && 'Upload could not be completed. Please review the error below.'}
                </div>
              )}

              {submitError && (
                <div className="mt-3 p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-semibold">
                  {submitError}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="relative z-10 border-t border-black/5 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-black/60">
                <Icon size={14} className="text-black/60" />
                <span className="text-[12px] font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <Link to="/free-trial" className="text-[12px] font-semibold text-black/45 underline underline-offset-4 hover:text-black transition-colors">
            Prefer to add project details? Use the full brief form
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
