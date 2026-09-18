import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, FileText, Image as ImageIcon, Lock, Upload, X } from 'lucide-react';
import { cx } from '../utils/theme';
import { getApiEndpoint } from '../lib/apiConfig';

const SERVICE_OPTIONS = [
  { id: 'background-removal', label: 'Background Removal' },
  { id: 'clipping-path', label: 'Clipping Path' },
  { id: 'retouching', label: 'Photo Retouching' },
  { id: 'color-correction', label: 'Color Correction' },
  { id: 'ghost-mannequin', label: 'Ghost Mannequin' },
  { id: 'shadow-creation', label: 'Shadow Creation' },
];

const FORMAT_OPTIONS = ['JPG', 'PNG', 'WebP', 'TIFF', 'PSD', 'Other'];


interface FileWithPreview {
  file: File;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileList = (files: FileWithPreview[], onRemove: (index: number) => void, tone: 'main' | 'support') => (
  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
    {files.map((asset, index) => (
      <div key={`${asset.file.name}-${index}`} className={cx(
        'relative flex min-w-0 items-center gap-2 rounded-xl border p-3 shadow-sm',
        tone === 'main' ? 'border-black bg-black text-white' : 'border-orange-200 bg-orange-50 text-black'
      )}>
        <button type="button" onClick={() => onRemove(index)} className="absolute -right-1.5 -top-1.5 rounded-full border border-black/10 bg-white p-1 text-black shadow-sm">
          <X size={11} />
        </button>
        {tone === 'main' ? <ImageIcon size={15} className="shrink-0 text-white/70" /> : <FileText size={15} className="shrink-0 text-orange-500" />}
        <span className="truncate text-[12px] font-semibold">{asset.file.name} · {formatFileSize(asset.file.size)}</span>
      </div>
    ))}
  </div>
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PilotBatchPage: React.FC = () => {
  const navigate = useNavigate();
  const mainInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = !!localStorage.getItem('portal_token') && localStorage.getItem('portal_token') !== 'null';

  const [selectedService, setSelectedService] = useState('background-removal');
  const [outputFormat, setOutputFormat] = useState('JPG');
  const [customFormat, setCustomFormat] = useState('');
  const [mainFiles, setMainFiles] = useState<FileWithPreview[]>([]);
  const [supportFiles, setSupportFiles] = useState<FileWithPreview[]>([]);
  const [instructions, setInstructions] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedOrderCode, setSubmittedOrderCode] = useState('');

  const addMainFiles = (files: File[]) => {
    const incoming = files.slice(0, Math.max(15 - mainFiles.length, 0)).map(file => ({ file }));
    setMainFiles(prev => [...prev, ...incoming]);
  };

  const addSupportFiles = (files: File[]) => {
    setSupportFiles(prev => [...prev, ...files.map(file => ({ file }))]);
  };

  const finalFormat = outputFormat === 'Other' ? customFormat.trim() : outputFormat;
  const guestEmailValid = isAuthenticated || EMAIL_REGEX.test(email.trim());
  const canProceed = mainFiles.length > 0 && !!selectedService && !!finalFormat && guestEmailValid;

  const handleSubmit = async () => {
    if (!canProceed || isSubmitting) return;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('service', selectedService);
      formData.append('outputFormat', finalFormat);
      formData.append('instructions', instructions);
      if (!isAuthenticated) formData.append('email', email.trim());
      mainFiles.forEach(({ file }) => formData.append('mainFiles', file));
      supportFiles.forEach(({ file }) => formData.append('supportFiles', file));

      const token = localStorage.getItem('portal_token');
      const headers: Record<string, string> = {};
      if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiEndpoint('/portal/pilot-batch'), {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Submission failed. Please try again.');

      if (data.token) {
        localStorage.setItem('portal_token', data.token);
        if (data.user) localStorage.setItem('customer_name', data.user.name);
      }

      setSubmittedOrderCode(data.orderCode);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrderCode) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto">
            <CheckCircle size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-black">Test Batch Received</h1>
            <p className="mt-2 text-[15px] text-black/55 leading-relaxed">
              Your files are being reviewed. We'll send a pricing breakdown to{' '}
              <strong>{isAuthenticated ? 'your account email' : email}</strong> within 30 minutes.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-neutral-50 px-6 py-4 inline-block">
            <p className="text-[11px] font-bold uppercase tracking-widest text-black/40">Order Reference</p>
            <p className="mt-1 text-[22px] font-bold text-black tracking-wider">{submittedOrderCode}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full bg-black px-6 py-3 text-[14px] font-bold text-white hover:bg-black/80 transition-colors"
            >
              Track in Dashboard
            </button>
            <Link
              to="/"
              className="rounded-full border border-black/10 px-6 py-3 text-[14px] font-bold text-black hover:bg-neutral-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <Helmet>
        <title>Test Batch Review | Reframe Visuals</title>
        <meta name="description" content="Submit a paid test batch for service-specific review, output-format preferences, and complexity-based pricing confirmation." />
        <link rel="canonical" href="https://reframevisuals.com/pilot-batch" />
      </Helmet>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] sm:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">Paid Test Batch</p>
          <h1 className="mt-3 text-[34px] font-bold leading-tight tracking-tight text-black sm:text-[44px]">Test Batch Review</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/60">
            Submit a small paid batch for review. Final price depends on service type and image complexity. We will send details within 30 minutes.
          </p>

          {!isAuthenticated && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex items-start gap-3">
                <Lock size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-[14px] font-bold">Track your order in your dashboard</p>
                  <p className="mt-1 text-[13px] leading-relaxed">Log in or create an account to track this batch and manage revisions. You can also continue as a guest — we'll email your quote within 30 minutes.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => navigate('/login')} className="rounded-full bg-black px-4 py-2 text-[12px] font-bold text-white">Login</button>
                    <button type="button" onClick={() => navigate('/signup')} className="rounded-full border border-black/10 bg-white px-4 py-2 text-[12px] font-bold text-black">Create account</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-bold text-black/70">Service</label>
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-neutral-50 px-3 text-[14px] font-semibold outline-none focus:border-black/30">
                {SERVICE_OPTIONS.map(service => <option key={service.id} value={service.id}>{service.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-black/70">Output format</label>
              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="h-11 w-full rounded-xl border border-black/10 bg-neutral-50 px-3 text-[14px] font-semibold outline-none focus:border-black/30">
                {FORMAT_OPTIONS.map(format => <option key={format} value={format}>{format}</option>)}
              </select>
              {outputFormat === 'Other' && (
                <input value={customFormat} onChange={(e) => setCustomFormat(e.target.value)} placeholder="Enter format" className="mt-2 h-10 w-full rounded-xl border border-black/10 px-3 text-[14px] outline-none focus:border-black/30" />
              )}
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-[13px] font-bold text-black/70">Project notes</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} placeholder="Describe the batch, references, background, color, and delivery needs..." className="min-h-[140px] max-h-[420px] w-full resize-y rounded-xl border border-black/10 bg-neutral-50 px-3 py-3 text-[14px] outline-none focus:border-black/30" />
          </div>

          <div className="mt-5 rounded-2xl border border-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-black">Main batch files</p>
                <p className="text-[12px] text-black/50">Up to 15 images. These count toward pilot quantity.</p>
              </div>
              <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Counted</span>
            </div>
            <button type="button" onClick={() => mainInputRef.current?.click()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-neutral-50 p-4 text-[13px] font-bold text-black hover:border-black">
              <Upload size={16} /> Upload main images
            </button>
            <input ref={mainInputRef} type="file" multiple accept="image/*,.psd,.psb,.tif,.tiff,.raw,.cr2,.nef,.arw,.dng" onChange={(e) => { addMainFiles(Array.from(e.target.files || [])); e.target.value = ''; }} className="hidden" />
            {mainFiles.length > 0 && fileList(mainFiles, index => setMainFiles(prev => prev.filter((_, i) => i !== index)), 'main')}
          </div>

          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-black">Supporting images / references</p>
                <p className="text-[12px] text-black/55">References, briefs, examples, or PDFs. These stay separate from main files.</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-600">Not counted</span>
            </div>
            <button type="button" onClick={() => supportInputRef.current?.click()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 bg-white/80 p-4 text-[13px] font-bold text-black hover:bg-white">
              <Upload size={16} /> Upload supporting files
            </button>
            <input ref={supportInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => { addSupportFiles(Array.from(e.target.files || [])); e.target.value = ''; }} className="hidden" />
            {supportFiles.length > 0 && fileList(supportFiles, index => setSupportFiles(prev => prev.filter((_, i) => i !== index)), 'support')}
          </div>

          {!isAuthenticated && (
            <div className="mt-5">
              <label className="mb-1 block text-[13px] font-bold text-black/70">
                Email for quote delivery <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11 w-full rounded-xl border border-black/10 bg-neutral-50 px-3 text-[14px] outline-none focus:border-black/30"
              />
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[13px] leading-relaxed text-blue-900">
            Final price depends on service type and image complexity. {isAuthenticated ? 'After review, your estimate will appear in your dashboard.' : 'We will email your pricing breakdown within 30 minutes.'}
          </div>

          {submitError && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed || isSubmitting}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-black px-8 text-[15px] font-bold text-white disabled:opacity-50 sm:w-auto transition-opacity"
          >
            {isSubmitting ? 'Uploading…' : 'Submit Test Batch for Review'}
          </button>
        </section>

        <aside className="rounded-[28px] border border-black/10 bg-neutral-50 p-6 sm:p-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-black/40">Why Test Batch</p>
          <h2 className="mt-3 text-[24px] font-bold text-black">What you get</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-[14px] font-semibold text-black">Proof before scale</p>
              <p className="mt-1 text-[13px] text-black/55 leading-relaxed">See actual Reframe quality on your own images before committing to a larger batch.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-[14px] font-semibold text-black">Workflow fit check</p>
              <p className="mt-1 text-[13px] text-black/55 leading-relaxed">Confirm instructions, references, file handling, and turnaround expectations early.</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-[14px] font-semibold text-black">Risk-free decision</p>
              <p className="mt-1 text-[13px] text-black/55 leading-relaxed">Use the result to approve style direction, request adjustments, or brief the next batch with confidence.</p>
            </div>
          </div>
          <Link to="/free-trial" className="mt-6 inline-flex text-[13px] font-bold text-black underline underline-offset-4">Need only 3 free samples?</Link>
        </aside>
      </div>
    </div>
  );
};

export default PilotBatchPage;
