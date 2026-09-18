import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Image as ImageIcon, Check, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import FreeTrialSuccess from '../sections/freetrial/FreeTrialSuccess';
import { cx } from '../utils/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEGORY_OPTIONS = [
  'Apparel / Fashion',
  'Jewelry',
  'Furniture',
  'Beauty / Cosmetics',
  'Electronics',
  'Accessories',
  'Marketplace product',
  'Other',
];

const SERVICE_OPTIONS = [
  'Background Removal',
  'Clipping Path',
  'Photo Retouching',
  'Color Correction',
  'Ghost Mannequin',
  'Shadow Creation',
  'Not sure yet',
];

interface FileWithPreview {
  file: File;
  preview: string;
}

type UploadStage = 'idle' | 'uploading' | 'done' | 'error';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FreeTrialPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const projectAssetsRef = useRef<FileWithPreview[]>([]);
  const supportAssetsRef = useRef<FileWithPreview[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    name: '',
    email: new URLSearchParams(window.location.search).get('email') || '',
    platform: '',
    volume: '',
    customVolume: '',
    timeline: '',
  });
  const [serviceRows, setServiceRows] = useState([{ category: '', customCategory: '', serviceType: '' }]);
  const [projectAssets, setProjectAssets] = useState<FileWithPreview[]>([]);
  const [supportAssets, setSupportAssets] = useState<FileWithPreview[]>([]);
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
    supportAssetsRef.current = supportAssets;
  }, [supportAssets]);

  useEffect(() => {
    return () => {
      projectAssetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.preview));
      supportAssetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.preview));
    };
  }, []);

  const toValidAssets = (files: File[]) => files
    .filter((f) => f.type.startsWith('image/') && f.size <= 15 * 1024 * 1024)
    .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));

  const toValidSupportAssets = (files: File[]) => files
    .filter((f) => f.size <= 25 * 1024 * 1024)
    .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));

  const addProjectAssets = useCallback((incoming: FileWithPreview[]) => {
    if (!incoming.length) return;
    setProjectAssets(prev => {
      const availableSlots = Math.max(3 - prev.length, 0);
      const accepted = incoming.slice(0, availableSlots);
      const rejected = incoming.slice(availableSlots);
      rejected.forEach(asset => URL.revokeObjectURL(asset.preview));
      setRejectedFileNames(rejected.map(asset => asset.file.name));
      setUploadNotice(rejected.length > 0 ? 'Free sample allows up to 3 images. Extra files were not added.' : '');
      return [...prev, ...accepted];
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addProjectAssets(toValidAssets(Array.from(e.target.files)));
    e.target.value = '';
  };

  const handleSupportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSupportAssets(prev => [...prev, ...toValidSupportAssets(Array.from(e.target.files))]);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addProjectAssets(toValidAssets(Array.from(e.dataTransfer.files)));
  };

  const removeFile = useCallback((index: number) => {
    setProjectAssets(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      if (updated.length < 3) {
        setUploadNotice('');
        setRejectedFileNames([]);
      }
      return updated;
    });
  }, []);

  const removeSupportFile = useCallback((index: number) => {
    setSupportAssets(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  }, []);

  const removeRow = (idx: number) => setServiceRows(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: string, value: string) =>
    setServiceRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  const firstRow = serviceRows[0] || { category: '', customCategory: '', serviceType: '' };
  const finalCategory = firstRow.category === 'Other'
    ? firstRow.customCategory.trim()
    : firstRow.category.trim();
  const finalVolume = formData.volume === 'custom'
    ? `Custom: ${formData.customVolume} images/month`
    : formData.volume;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');
    setUploadStage('uploading');

    try {
      const formDataToSend = new FormData();
      const servicesText = serviceRows
        .map(r => {
          const cat = r.category === 'Other' ? r.customCategory.trim() : r.category.trim();
          const service = r.serviceType.trim();
          if (cat && service) return `${cat} — ${service}`;
          if (cat) return `Category: ${cat}`;
          if (service) return `Service: ${service}`;
          return '';
        })
        .filter(Boolean)
        .join('; ');
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('category', finalCategory);
      formDataToSend.append('volume', finalVolume);
      formDataToSend.append('serviceType', firstRow.serviceType || 'Not provided');
      const qualifiedDescription = [
        formData.description,
        `Services requested: ${servicesText || 'Not provided'}`,
        `Target platform: ${formData.platform || 'Not provided'}`,
        `Estimated monthly volume: ${finalVolume || 'Not provided'}`,
        `Paid project timeline: ${formData.timeline || 'Not provided'}`,
      ].filter(Boolean).join('\n\n');
      formDataToSend.append('description', qualifiedDescription);
      projectAssets.forEach((asset) => formDataToSend.append('files', asset.file));
      supportAssets.forEach((asset) => formDataToSend.append('supportFiles', asset.file));

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

  const isFormValid =
    projectAssets.length > 0 &&
    formData.name.trim() !== '' &&
    EMAIL_REGEX.test(formData.email) &&
    formData.platform.trim() !== '' &&
    formData.volume.trim() !== '' &&
    (formData.volume !== 'custom' || Number(formData.customVolume) > 0);

  if (submitted) {
    return <FreeTrialSuccess onBack={() => navigate('/')} />;
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-6 pb-24 relative overflow-hidden flex items-start justify-center">
      <Helmet>
        <title>Get 3 Free Sample Edits | Reframe Visuals</title>
        <meta name="description" content="Get 3 free sample edits with our product photo editing trial. Evaluate our clipping path, background removal, or retouching quality with no card required." />
        <link rel="canonical" href="https://reframevisuals.com/free-trial" />
      </Helmet>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-emerald-100/20 to-teal-200/20 blur-[80px] opacity-70" />
        <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-green-100/10 to-emerald-100/15 blur-[90px] opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-5xl relative z-10">
        <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] flex flex-col md:flex-row">
          <div className="pointer-events-none absolute inset-0">
            <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 opacity-[0.035]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/40" />
          </div>

          <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Free Evaluation</h3>
              <h1 className="text-[36px] sm:text-[40px] font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1]">
                Get 3 images edited free
              </h1>
              <p className="text-[16px] text-black/60 leading-relaxed">
                Upload up to 3 product photos. We’ll edit them free so you can evaluate quality and turnaround.
              </p>
              <Link to="/pilot-batch" className="inline-flex text-[12px] font-bold text-black underline underline-offset-4">
                Need a paid review batch? Start Test Batch
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
              <div className="space-y-2">
                {serviceRows.map((row, idx) => (
                  <div key={idx} className="relative rounded-xl border border-black/5 bg-black/[0.015] p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[14px] font-semibold text-black/70">Product Category <span className="text-black/35">(optional)</span></label>
                        <select
                          value={row.category}
                          onChange={(e) => updateRow(idx, 'category', e.target.value)}
                          className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white h-[42px]"
                        >
                          <option value="">Select category (optional)</option>
                          {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        {row.category === 'Other' && (
                          <input
                            type="text"
                            value={row.customCategory}
                            onChange={(e) => updateRow(idx, 'customCategory', e.target.value)}
                            placeholder="Enter category"
                            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                          />
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-[14px] font-semibold text-black/70">Target Platform <span className="text-red-600">*</span></label>
                        <select
                          value={formData.platform}
                          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                          className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white h-[42px]"
                          required
                        >
                          <option value="">Select platform</option>
                          <option>Amazon</option>
                          <option>Website</option>
                          <option>Marketplace</option>
                          <option>Agency client</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[14px] font-semibold text-black/70">Monthly Image Volume <span className="text-red-600">*</span></label>
                        <select
                          value={formData.volume}
                          onChange={(e) => setFormData({ ...formData, volume: e.target.value, customVolume: e.target.value === 'custom' ? formData.customVolume : '' })}
                          className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white h-[42px]"
                          required
                        >
                          <option value="">Select volume</option>
                          <option>1-25 images</option>
                          <option>26-100 images</option>
                          <option>101-500 images</option>
                          <option>500+ images</option>
                          <option value="custom">Custom quantity</option>
                        </select>
                        {formData.volume === 'custom' && (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={formData.customVolume}
                            onChange={(e) => setFormData({ ...formData, customVolume: e.target.value })}
                            placeholder="e.g. 750"
                            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[15px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                          />
                        )}
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-[14px] font-semibold text-black/70">Service Name <span className="text-black/35">(optional)</span></label>
                          <select
                            value={row.serviceType}
                            onChange={(e) => updateRow(idx, 'serviceType', e.target.value)}
                            className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white h-[42px]"
                          >
                            <option value="">Select service (optional)</option>
                            {SERVICE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>
                        {serviceRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="mb-3 shrink-0 text-black/30 hover:text-black/60 transition-colors"
                            aria-label="Remove row"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-semibold text-black/70">Project Brief</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us the edit style, background, color, format, or reference direction..."
                  className="w-full min-h-[120px] max-h-[320px] resize-y rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-semibold text-black/70">Upload Source Images <span className="text-red-600">*</span></label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cx(
                    'cursor-pointer p-4 border border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-all text-center',
                    isDragging ? 'bg-black/[0.02] border-black scale-[0.99]' : 'border-black/20 hover:border-black hover:bg-black/[0.01]'
                  )}
                >
                  <Upload size={16} className="text-black/60" />
                  <p className="text-[12px] text-black/60">
                    Drop up to 3 images or <span className="text-black font-semibold underline">browse</span>
                  </p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />

                {uploadNotice && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                    <div className="flex items-start gap-2 font-semibold"><AlertTriangle size={14} className="mt-0.5" />{uploadNotice}</div>
                    {rejectedFileNames.length > 0 && <p className="mt-1 text-[11px]">Rejected: {rejectedFileNames.join(', ')}</p>}
                  </div>
                )}

                {projectAssets.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-[12px] font-bold text-black/70">{projectAssets.length} image{projectAssets.length === 1 ? '' : 's'} selected for upload</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {projectAssets.map((asset, i) => (
                        <div key={i} className="min-w-0 flex items-center gap-2 p-2.5 rounded-lg border border-black bg-black text-white relative shadow-sm">
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-white text-black rounded-full border border-black/10 shadow-sm hover:bg-black/5 transition-all"
                          >
                            <X size={10} />
                          </button>
                          <ImageIcon size={14} className="text-white/70 shrink-0" />
                          <span className="text-[11px] font-medium text-white truncate">{asset.file.name} · {formatFileSize(asset.file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-semibold text-black/70">Support / Reference Files <span className="text-black/35">(optional)</span></label>
                <div
                  onClick={() => supportInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border border-dashed border-orange-300 bg-orange-50/60 p-4 text-center transition-all hover:bg-orange-50"
                >
                  <Upload size={16} className="mx-auto text-orange-500" />
                  <p className="mt-1 text-[12px] text-black/60">
                    Add ghost mannequin inner shots, brand guides, PDFs, markups, or references. These are not counted as the 3 free sample images.
                  </p>
                </div>
                <input ref={supportInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleSupportFileChange} className="hidden" />
                {supportAssets.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {supportAssets.map((asset, i) => (
                      <div key={`${asset.file.name}-${i}`} className="min-w-0 flex items-center gap-2 p-2.5 rounded-lg border border-orange-200 bg-orange-50 text-black relative shadow-sm">
                        <button
                          type="button"
                          onClick={() => removeSupportFile(i)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-white text-black rounded-full border border-black/10 shadow-sm hover:bg-black/5 transition-all"
                        >
                          <X size={10} />
                        </button>
                        <ImageIcon size={14} className="text-orange-500 shrink-0" />
                        <span className="text-[11px] font-medium text-black truncate">{asset.file.name} · {formatFileSize(asset.file.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-black/5 pt-3 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[14px] font-semibold text-black/70">Full Name <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Cooper"
                    className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[14px] font-semibold text-black/70">Work Email <span className="text-red-600">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full rounded-lg border border-black/10 bg-[var(--color-bg-secondary)] px-3 py-2 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {uploadStage !== 'idle' && (
                <div className={cx('p-3.5 rounded-xl border text-[13px] font-semibold',
                  uploadStage === 'uploading' && 'bg-blue-50 text-blue-700 border-blue-100',
                  uploadStage === 'done' && 'bg-green-50 text-green-700 border-green-100',
                  uploadStage === 'error' && 'bg-red-50 text-red-600 border-red-100'
                )}>
                  {uploadStage === 'uploading' && 'Uploading selected images...'}
                  {uploadStage === 'done' && 'Upload done. Your sample request has been received.'}
                  {uploadStage === 'error' && 'Upload could not be completed. Please review the error below.'}
                </div>
              )}

              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-[13px] font-semibold">
                  {submitError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full bg-[var(--color-text-primary)] px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Get 3 Images Edited Free'}
                </button>
              </div>
            </form>
          </div>

          <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">Trial Standards</h3>
            <div className="space-y-8">
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">3 Free Sample Edits</p>
                <p className="text-[14px] text-black/60 mt-1">Submit your images and test our quality with zero commitment. No credit card required.</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Back within 24 hours</p>
                <p className="text-[14px] text-black/60 mt-1">Your edited trial files come back within 24 hours, reviewed by our lead editors.</p>
              </div>
              <div>
                <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Secure Asset Handling</p>
                <p className="text-[14px] text-black/60 mt-1">Your source files are fully protected and never shared or used without your permission.</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-600" />
                  </div>
                  <p className="text-[13px] text-black/65">Need more than 3 files or a paid review? Use the dedicated Test Batch flow.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FreeTrialPage;
