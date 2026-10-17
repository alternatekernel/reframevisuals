import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Plus, Clock, CreditCard, ShieldCheck, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { cx } from '../../utils/theme';

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
  { icon: CreditCard, label: 'No credit card' },
  { icon: ShieldCheck, label: 'Files kept private' },
];

const InstantDropZone: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectAssetsRef = useRef<FileWithPreview[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', instructions: '', sourceLink: '' });
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
        formData.instructions.trim() || 'Instant drop-zone submission (homepage)'
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

  const hasFiles = projectAssets.length > 0;

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-10 pt-8 pb-4 lg:pt-12 lg:pb-6">
      <div className="rounded-[24px] border border-black/[0.18] bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.10)] sm:p-8">
        {submitted ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-green-100 bg-green-50">
              <Check size={22} className="text-green-600" />
            </div>
            <h2 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[var(--color-text-primary)]">
              Trial submitted.
            </h2>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-black/60">
              Your {projectAssets.length === 1 ? 'image is' : `${projectAssets.length} images are`} in our queue — edited files back within <strong>24 hours</strong>. Track progress from your dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 text-[14px] font-bold text-white transition-all duration-300 hover:bg-black active:scale-95"
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 text-center sm:mb-6">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black/40">Instant Free Trial</p>
              <h2 className="mt-2 text-[26px] sm:text-[34px] font-bold tracking-tight leading-[1.1] text-[var(--color-text-primary)]">
                Drop your product photos. Get 3 edited free.
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-[14px] sm:text-[15px] leading-relaxed text-black/55">
                No forms, no calls. Drag your images in and our lead editors send them back polished within 24 hours.
              </p>
            </div>

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
                'relative rounded-2xl border-2 border-dashed transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-black/30',
                isDragging
                  ? 'border-[var(--brand)] bg-orange-50/40 scale-[0.995]'
                  : 'border-black/15 bg-black/[0.04]',
                !hasFiles && 'cursor-pointer hover:border-black/40 hover:bg-black/[0.04]'
              )}
            >
              {!hasFiles ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 sm:py-14 text-center">
                  <div className={cx(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                    isDragging ? 'bg-black text-white' : 'bg-black/[0.04] text-black/60'
                  )}>
                    <Upload size={20} />
                  </div>
                  <div>
                    <p className="text-[15px] sm:text-[17px] font-bold text-[var(--color-text-primary)]">
                      {isDragging ? 'Release to add your images' : 'Drag up to 3 images here'}
                    </p>
                    <p className="mt-1 text-[12px] text-black/50">
                      or <span className="font-semibold text-black underline underline-offset-4">browse your files</span> · JPG, PNG, WEBP · up to 15MB each
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {projectAssets.map((asset, i) => (
                      <div key={`${asset.file.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-black/[0.18] bg-black/[0.04]">
                        <img src={asset.preview} alt={asset.file.name} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          aria-label={`Remove ${asset.file.name}`}
                          className="absolute right-2 top-2 rounded-full border border-black/[0.18] bg-white p-1.5 text-black shadow-sm transition-all hover:bg-black hover:text-white"
                        >
                          <X size={11} />
                        </button>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5">
                          <p className="truncate text-[12px] font-medium text-white">{asset.file.name} · {formatFileSize(asset.file.size)}</p>
                        </div>
                      </div>
                    ))}
                    {projectAssets.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/20 text-black/50 transition-all hover:border-black hover:bg-black/[0.04] hover:text-black"
                      >
                        <Plus size={18} />
                        <span className="text-[12px] font-semibold">Add more</span>
                        <span className="text-[12px] text-black/40">{MAX_FILES - projectAssets.length} slot{MAX_FILES - projectAssets.length === 1 ? '' : 's'} left</span>
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
                {rejectedFileNames.length > 0 && <p className="mt-1 text-[12px]">Not added: {rejectedFileNames.join(', ')}</p>}
              </div>
            )}

            {hasFiles && (
              <form onSubmit={handleSubmit} noValidate className="mt-4 rounded-2xl border border-black/[0.18] bg-[var(--color-bg-secondary)] p-4 sm:p-5">
                <p className="mb-3 text-[14px] font-bold text-[var(--color-text-primary)]">
                  Last step — where do we send your edited images?
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    autoFocus
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    aria-label="Full name"
                    required
                    className="flex-1 rounded-full border border-black/[0.18] bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Work email"
                    aria-label="Work email"
                    required
                    className="flex-1 rounded-full border border-black/[0.18] bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                  />
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 text-[14px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Uploading...' : 'Get my free edits'}
                    {!isSubmitting && <ArrowRight size={15} />}
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
                    className="w-full resize-y rounded-2xl border border-black/[0.18] bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                  />
                  <input
                    type="url"
                    value={formData.sourceLink}
                    onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                    placeholder="Drive / Dropbox / WeTransfer link to more files (optional)"
                    aria-label="Link to additional files"
                    className="w-full rounded-full border border-black/[0.18] bg-white px-5 py-3 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30"
                  />
                </div>

                {uploadStage === 'uploading' && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[14px] font-semibold text-blue-700">
                    Uploading your images...
                  </div>
                )}
                {submitError && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-[14px] font-semibold text-red-600">
                    {submitError}
                  </div>
                )}
              </form>
            )}

            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-black/55">
                    <Icon size={13} className="text-black/60" />
                    <span className="text-[11.5px] font-semibold">{label}</span>
                  </div>
                ))}
              </div>
              <Link to="/free-trial" className="text-[11.5px] font-semibold text-black/45 underline underline-offset-4 transition-colors hover:text-black">
                Prefer to add project details? Use the full brief form
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default InstantDropZone;
