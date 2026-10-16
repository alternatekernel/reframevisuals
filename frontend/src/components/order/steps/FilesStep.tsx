import React, { useRef, useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Link2, Plus, Trash2, X } from 'lucide-react';
import {
  CloudUploadIcon,
  Image01Icon,
  FolderOpenIcon,
  CpuIcon,
  DatabaseIcon,
} from 'hugeicons-react';
import { OrderFlowData } from '../types';
import { OrderFieldLabel, orderFooterClass, orderPrimaryButtonClass, orderSecondaryButtonClass } from '../flow-controls';

interface Props {
  orderData: OrderFlowData;
  setOrderData: React.Dispatch<React.SetStateAction<OrderFlowData>>;
  isTemplateMode?: boolean;
  isUsingTemplate?: boolean;
  onNext: () => void;
  onBack: () => void;
  onFastTrack?: () => void;
}

const FilesStep: React.FC<Props> = ({ orderData, setOrderData, isTemplateMode, isUsingTemplate, onNext, onBack, onFastTrack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSourceLinkInput, setShowSourceLinkInput] = useState(false);
  const [showCustomLinkInput, setShowCustomLinkInput] = useState(!!orderData.customFilesLink);
  const [sourceLinkDraft, setSourceLinkDraft] = useState('');
  const [sourceLinkError, setSourceLinkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);

  const workFiles = useMemo(
    () => orderData.files,
    [orderData.files]
  );
  const supportFiles = useMemo(
    () => orderData.supportFiles || [],
    [orderData.supportFiles]
  );

  // Create stable blob URLs and revoke on cleanup to prevent memory leaks
  const imageUrls = useMemo(
    () => workFiles.map(f => URL.createObjectURL(f)),
    [workFiles]
  );
  useEffect(() => {
    return () => imageUrls.forEach(url => URL.revokeObjectURL(url));
  }, [imageUrls]);

  const addFiles = (files: File[], isSupporting = false) => {
    if (!files.length) return;
    setOrderData(prev => ({
      ...prev,
      files: isSupporting ? prev.files : [...files, ...prev.files],
      supportFiles: isSupporting ? [...(prev.supportFiles || []), ...files] : (prev.supportFiles || []),
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isSupporting = false) => {
    addFiles(Array.from(e.target.files || []), isSupporting);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files, false);
  };

  const removeFile = (file: File) => {
    setOrderData(prev => ({
      ...prev,
      files: prev.files.filter(f => f !== file),
      supportFiles: (prev.supportFiles || []).filter(f => f !== file),
    }));
  };

  const addSourceLinks = () => {
    const rawLinks = sourceLinkDraft
      .split(/[\n,]+/)
      .map(link => link.trim())
      .filter(Boolean);

    if (rawLinks.length === 0) return;

    const validLinks: string[] = [];
    const invalidLinks: string[] = [];

    rawLinks.forEach(link => {
      try {
        const parsed = new URL(link);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
        validLinks.push(parsed.toString());
      } catch {
        invalidLinks.push(link);
      }
    });

    if (invalidLinks.length > 0) {
      setSourceLinkError('Please enter full links starting with https:// or http://');
      return;
    }

    setOrderData(prev => ({
      ...prev,
      sourceLinks: Array.from(new Set([...(prev.sourceLinks || []), ...validLinks])),
    }));
    setSourceLinkDraft('');
    setSourceLinkError(null);
  };

  const removeSourceLink = (link: string) => {
    setOrderData(prev => ({
      ...prev,
      sourceLinks: (prev.sourceLinks || []).filter(existing => existing !== link),
    }));
  };

  const hasAssets = workFiles.length > 0 || (orderData.sourceLinks || []).length > 0 || !!orderData.customFilesLink;

  return (
    <div className="flex flex-col flex-1 space-y-2 sm:space-y-3 px-2 sm:px-3 py-2 sm:py-3 min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 sm:space-y-3 pr-1">
        <div className="flex items-center justify-between gap-3">
          <OrderFieldLabel>Original / Main Files</OrderFieldLabel>
          <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-1 text-caption font-heading font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            Counted for editing
          </span>
        </div>

        {/* Main Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed transition-[background-color,border-color,box-shadow,transform] duration-300 overflow-hidden flex flex-col items-center justify-center ${
            isDragging
              ? 'border-[var(--research-blue)] bg-[var(--research-blue)]/5 ring-8 ring-[var(--research-blue)]/5 scale-[0.99]'
              : 'border-[var(--research-blue)]/20 bg-[var(--research-blue-light)]'
          } rounded-3xl h-[180px] sm:h-[240px] ${
            workFiles.length === 0 || isDragging ? 'cursor-pointer group' : 'p-4'
          }`}
        >
          <AnimatePresence mode="wait">
            {isDragging ? (
              <motion.div
                key="dragging"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -10 }}
                className="flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-20 h-20 bg-[var(--research-blue)] text-white rounded-full flex items-center justify-center animate-pulse">
                  <CloudUploadIcon size={40} />
                </div>
                <div className="text-center">
                  <p className="text-body text-[var(--research-blue)] font-normal">Release to Upload</p>
                  <p className="text-caption text-[var(--research-blue)]/60 font-normal mt-1">Ready for processing</p>
                </div>
              </motion.div>
            ) : workFiles.length === 0 ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <div className="absolute top-6 left-6 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <CpuIcon size={60} />
                </div>
                <div className="absolute bottom-6 right-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                  <DatabaseIcon size={60} />
                </div>
                <div className="relative z-10 text-center">
                  <div className="flex justify-center items-center gap-4 sm:gap-8 mb-4 sm:mb-8">
                    <Image01Icon size={32} className="text-[var(--research-blue)] opacity-30" />
                    <CloudUploadIcon size={44} className="text-[var(--research-blue)] sm:w-16 sm:h-16" />
                    <FolderOpenIcon size={32} className="text-[var(--research-blue)] opacity-30" />
                  </div>
                  <p className="text-caption text-[var(--color-text-primary)] font-normal">Drop original files to upload</p>
                  <p className="text-caption text-[var(--color-text-primary)]/50 font-normal mt-1">Main images, PSD, TIFF, RAW</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--research-blue)] animate-pulse" />
                  <p className="text-caption text-[var(--color-text-primary)] font-normal">
                    {workFiles.length} Main File{workFiles.length === 1 ? '' : 's'} Ready for Processing
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {workFiles.map((file, i) => (
                      <motion.div
                        key={imageUrls[i]}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.03 }}
                        className="aspect-square relative bg-white rounded-lg overflow-hidden border border-[var(--color-border-subtle)] group/item"
                      >
                        <img src={imageUrls[i]} alt={file.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeFile(file)}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square flex flex-col items-center justify-center bg-white/40 border border-dashed border-[var(--research-blue)]/20 rounded-lg hover:bg-white/80 transition-[background-color,transform] duration-200 group/add"
                    >
                      <Plus size={20} className="text-[var(--research-blue)] group-hover/add:scale-125 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*,.psd,.psb,.tif,.tiff,.raw,.cr2,.nef,.arw,.dng" multiple onChange={e => handleFileSelect(e, false)} className="hidden" />
        <input ref={supportInputRef} type="file" accept="*" multiple onChange={e => handleFileSelect(e, true)} className="hidden" />

        {/* External file links — compact toggle */}
        <div className="mt-2 sm:mt-3">
          {!(orderData.sourceLinks || []).length && !showSourceLinkInput ? (
            <button
              type="button"
              onClick={() => setShowSourceLinkInput(true)}
              className="text-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium flex items-center justify-center gap-1.5 mx-auto h-9 px-4 border border-[var(--color-border-light)] rounded-lg bg-white hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
            >
              <Link2 size={13} />
              Paste a link to your files (Dropbox, Drive, etc.)
            </button>
          ) : (
            <div className="p-4 bg-white border border-[var(--color-border-subtle)] rounded-2xl space-y-3 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-[var(--color-text-secondary)]" />
                  <span className="text-caption font-bold text-[var(--color-text-primary)]">File Link</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceLinkInput(false);
                    setSourceLinkDraft('');
                    setSourceLinkError(null);
                  }}
                  className="text-caption text-red-500 hover:text-red-700 hover:underline font-semibold"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={sourceLinkDraft}
                  onChange={e => { setSourceLinkDraft(e.target.value); setSourceLinkError(null); }}
                  onBlur={() => { if (sourceLinkDraft.trim()) addSourceLinks(); }}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)}
                  placeholder="https://dropbox.com/sh/..."
                  rows={2}
                  className="min-h-[42px] flex-1 resize-none rounded-xl border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-caption text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-[border-color,box-shadow] duration-200"
                />
                <button
                  type="button"
                  onClick={addSourceLinks}
                  className={`${orderSecondaryButtonClass} h-[42px] px-4 text-caption shrink-0`}
                >
                  Add
                </button>
              </div>
              {sourceLinkError && <p className="text-caption text-red-500">{sourceLinkError}</p>}
              {(orderData.sourceLinks || []).length > 0 && (
                <div className="space-y-1.5">
                  {(orderData.sourceLinks || []).map(link => (
                    <div key={link} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] px-3 py-2">
                      <span className="truncate text-caption text-[var(--color-text-secondary)]">{link}</span>
                      <button type="button" onClick={() => removeSourceLink(link)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors" aria-label="Remove link">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Supporting References */}
        <section className="mt-3 rounded-2xl border border-[var(--research-peach)]/35 bg-[var(--research-peach-light)]/35 p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-caption font-semibold text-[var(--color-text-primary)]">Supporting files / references</p>
              <p className="text-caption text-[var(--color-text-secondary)]">Briefs, examples, reference images, PDFs, or notes. These stay separate from main files.</p>
            </div>
            <span className="w-fit rounded-full bg-white px-2.5 py-1 text-caption font-heading font-black uppercase tracking-[0.2em] text-[var(--research-peach)]">
              Not counted as main
            </span>
          </div>
          <div
            onClick={() => supportInputRef.current?.click()}
            className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--research-peach)]/50 bg-white/70 p-3 cursor-pointer hover:bg-white transition-colors duration-200 group"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--research-peach)]/10 flex items-center justify-center group-hover:bg-[var(--research-peach)]/20 transition-colors">
              <Plus size={14} className="text-[var(--research-peach)]" />
            </div>
            <p className="text-caption text-[var(--color-text-primary)] font-normal">
              Add supporting files only
            </p>
          </div>

          {supportFiles.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {supportFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2 px-3 bg-white border border-[var(--research-peach)]/25 rounded-lg group/file">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FolderOpenIcon size={14} className="text-[var(--research-peach)] shrink-0" />
                  <span className="text-caption text-[var(--color-text-primary)] font-medium truncate uppercase">{file.name}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeFile(file); }}
                  className="flex min-w-[44px] min-h-[44px] items-center justify-center hover:bg-red-50 text-red-400 opacity-100 sm:opacity-0 sm:group-hover/file:opacity-100 transition-opacity rounded-lg"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 size={14} />
                </button>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* Custom Files Link Input */}
        {!isTemplateMode && (
          <div className="mt-3">
            {!showCustomLinkInput ? (
              <button
                type="button"
                onClick={() => setShowCustomLinkInput(true)}
                className="text-caption text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium flex items-center justify-center gap-1.5 mx-auto h-9 px-4 border border-[var(--color-border-light)] rounded-lg bg-white hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
              >
                <Link size={13} />
                Or paste a link to your files (Dropbox, Drive, etc.)
              </button>
            ) : (
              <div className="p-4 bg-white border border-[var(--color-border-subtle)] rounded-2xl space-y-3 shadow-sm transition-all text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link size={14} className="text-[var(--color-text-secondary)]" />
                    <span className="text-caption font-bold text-[var(--color-text-primary)]">Paste Files Link</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomLinkInput(false);
                      setOrderData(prev => ({ ...prev, customFilesLink: '', customFilesCount: undefined }));
                    }}
                    className="text-caption text-red-500 hover:text-red-700 hover:underline font-semibold"
                  >
                    Clear Link
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <input
                      type="url"
                      placeholder="e.g., https://dropbox.com/sh/..."
                      value={orderData.customFilesLink || ''}
                      onChange={(e) => setOrderData(prev => ({ ...prev, customFilesLink: e.target.value }))}
                      className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-xl text-caption font-medium text-[#171717] focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-[border-color,box-shadow] duration-200 placeholder-[#999] shadow-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="File count"
                      min="1"
                      value={orderData.customFilesCount || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setOrderData(prev => ({ ...prev, customFilesCount: Number.isNaN(val) ? undefined : val }));
                      }}
                      className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-xl text-caption font-medium text-[#171717] focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-all placeholder-[#999] shadow-sm"
                    />
                  </div>
                </div>
                <p className="text-caption text-[var(--color-text-muted)] leading-relaxed font-normal">
                  Our editors will download your assets directly from this folder. Please make sure the link is set to **anyone with the link can view** (public access).
                </p>
              </div>
            )}
          </div>
        )}

        {isTemplateMode && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 text-caption font-bold">i</div>
            <div>
              <p className="text-caption text-blue-700 font-semibold">Template Mode</p>
              <p className="text-caption text-blue-600 mt-0.5">Files are not saved in templates. This step is optional during template creation.</p>
            </div>
          </div>
        )}
        {!isTemplateMode && !hasAssets && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-caption font-medium rounded-xl text-center animate-in fade-in slide-in-from-top-1">
            Please upload at least one image, add a source link, or paste a folder link to proceed.
          </div>
        )}
      </div>

      <div className={orderFooterClass}>
        <button
          onClick={onBack}
          className={orderSecondaryButtonClass}
        >
          ← Back
        </button>
        <button
          onClick={isUsingTemplate && onFastTrack ? onFastTrack : onNext}
          disabled={!isTemplateMode && !hasAssets}
          className={orderPrimaryButtonClass}
        >
          {isUsingTemplate ? 'Review Order' : 'Technical Specs'}
        </button>
      </div>
    </div>
  );
};

export default FilesStep;
