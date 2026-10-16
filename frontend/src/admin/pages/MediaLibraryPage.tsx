import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image as ImageIcon, RefreshCw, Upload, X, Copy, Check, Trash2, List, LayoutGrid, AlertTriangle } from 'lucide-react';
import { adminFetch, API_BASE_URL } from '../utils/api';

interface MediaItem {
  id: string;
  publicId: string;
  url: string;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  altText?: string | null;
  caption?: string | null;
  createdAt: string;
  usedIn?: Array<{ type: 'page' | 'post' | 'section'; name: string; url: string }>;
}

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const MediaLibraryPage: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ media: MediaItem[] }>('/cms/media?limit=200');
      setMedia(data.media || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    const token = localStorage.getItem('admin_token');
    try {
      for (const file of list) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_BASE_URL}/cms/media`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Upload failed (${res.status})`);
        }
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const saveMeta = async () => {
    if (!selected) return;
    try {
      await adminFetch(`/cms/media/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          altText: selected.altText,
          caption: selected.caption,
          url: selected.url,
          publicId: selected.publicId
        }),
      });
      await load();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const deleteMedia = async (id: string) => {
    if (!confirm('Delete this image? This removes it from Cloudinary too.')) return;
    try {
      await adminFetch(`/cms/media/${id}`, { method: 'DELETE' });
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const orphanedCount = media.filter((m) => !m.usedIn || m.usedIn.length === 0).length;
  const totalUsages = media.reduce((acc, m) => acc + (m.usedIn?.length || 0), 0);

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><ImageIcon size={16} strokeWidth={2.5} /></span>
          Media Library
        </div>
        <div className="an-page-desc">{media.length} images</div>
        <div className="an-page-actions">
          <div className="flex border border-[var(--an-border)] rounded-lg overflow-hidden mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
          <button onClick={load} className="an-btn an-btn-ghost an-btn-sm"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="an-btn an-btn-primary an-btn-sm">
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Add New'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <ImageIcon size={14} />, label: 'Total Images', value: media.length, sub: 'Assets in Cloudinary' },
          { icon: <Check size={14} className="text-emerald-600" />, label: 'Total References', value: totalUsages, sub: `Used across platform` },
          { icon: <AlertTriangle size={14} className="text-amber-600" />, label: 'Orphaned (Not Used)', value: orphanedCount, sub: 'Not linked in any page/post' },
        ].map((c) => (
          <div key={c.label} className="an-card-flush rounded-xl p-4 bg-white border border-[var(--an-border)]">
            <div className="flex items-center gap-2 text-[11px] text-[#888] font-semibold uppercase tracking-wide mb-2">
              {c.icon}{c.label}
            </div>
            <div className="text-[22px] font-bold text-[var(--an-text)] leading-none">{c.value}</div>
            <div className="text-[11px] text-[#aaa] mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="an-card overflow-hidden"
      >
        {loading ? (
          <div className="p-10 text-center text-sm text-[#888]">Loading media...</div>
        ) : media.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#888]">
            <Upload size={28} className="mx-auto mb-3 text-[#ccc]" />
            Drag &amp; drop images here, or click “Add New” to upload.
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {media.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--an-border)] bg-[#f7f7f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
              >
                <img src={item.url} alt={item.altText || ''} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--an-border)] bg-[var(--an-surface,#fafafa)]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Preview</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Public ID / URL</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Info</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Size</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Used In</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Uploaded</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[#888]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--an-border)] hover:bg-black/[0.01] transition-colors cursor-pointer"
                    onClick={() => setSelected(item)}
                  >
                    {/* Thumbnail */}
                    <td className="px-4 py-3 w-16">
                      <div className="h-10 w-10 overflow-hidden rounded border border-[var(--an-border)] bg-[#f7f7f5] flex items-center justify-center">
                        <img src={item.url} alt={item.altText || ''} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    </td>

                    {/* Name / Public ID / URL */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="font-medium text-[var(--an-text)] truncate" title={item.publicId}>
                        {item.publicId}
                      </div>
                      <div className="text-[11px] text-[#aaa] font-mono truncate mt-0.5" title={item.url}>
                        {item.url}
                      </div>
                    </td>

                    {/* Dimensions & format */}
                    <td className="px-4 py-3 text-[#555]">
                      {item.width && item.height ? (
                        <span>
                          {item.width}×{item.height}
                          <span className="text-[#ccc] mx-1">·</span>
                          <span className="uppercase text-[11px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">{item.format || '—'}</span>
                        </span>
                      ) : (
                        <span className="text-[#ccc]">—</span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-[#555]">
                      {formatBytes(item.bytes)}
                    </td>

                    {/* Used In badge list */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {item.usedIn && item.usedIn.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[320px]">
                          {item.usedIn.map((ref, idx) => (
                            <a
                              key={idx}
                              href={ref.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                            >
                              <span className="capitalize text-[9px] font-bold tracking-wider opacity-60 mr-0.5">{ref.type}:</span>
                              {ref.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none text-red-700 bg-red-50 border-red-200">
                          <AlertTriangle size={10} /> Orphaned (Not Used)
                        </span>
                      )}
                    </td>

                    {/* Uploaded */}
                    <td className="px-4 py-3 text-[12px] text-[#aaa] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyUrl(item.url, item.id)}
                          title="Copy Link"
                          className="rounded p-1 text-[#bbb] hover:text-black hover:bg-black/5 transition-colors"
                        >
                          {copiedId === item.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={() => setSelected(item)}
                          className="an-btn an-btn-ghost an-btn-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMedia(item.id)}
                          className="rounded p-1 text-[#bbb] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Media drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-[var(--an-border)] bg-white px-5 py-4 flex items-center justify-between">
              <div className="text-[16px] font-bold text-[var(--an-text)]">Edit Media</div>
              <button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-black/5"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              <img src={selected.url} alt={selected.altText || ''} className="w-full rounded-lg border border-[var(--an-border)]" />

              <div className="grid grid-cols-2 gap-3 text-[12px] text-[#777]">
                <div>Dimensions<div className="text-[var(--an-text)] font-medium">{selected.width || '?'}×{selected.height || '?'}</div></div>
                <div>Size<div className="text-[var(--an-text)] font-medium">{formatBytes(selected.bytes)}</div></div>
                <div>Format<div className="text-[var(--an-text)] font-medium uppercase">{selected.format || '—'}</div></div>
                <div>Uploaded<div className="text-[var(--an-text)] font-medium">{new Date(selected.createdAt).toLocaleDateString()}</div></div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Alt text</span>
                <input value={selected.altText || ''} onChange={(e) => setSelected({ ...selected, altText: e.target.value })}
                  className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Caption</span>
                <input value={selected.caption || ''} onChange={(e) => setSelected({ ...selected, caption: e.target.value })}
                  className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40" />
              </label>

              <div className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Media URL / Cloudinary Link</span>
                <div className="flex items-center gap-2">
                  <input value={selected.url || ''} onChange={(e) => setSelected({ ...selected, url: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40" />
                  <button onClick={() => copyUrl(selected.url, selected.id)} className="an-btn an-btn-ghost an-btn-sm shrink-0">
                    {copiedId === selected.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Cloudinary Public ID</span>
                <input value={selected.publicId || ''} onChange={(e) => setSelected({ ...selected, publicId: e.target.value })}
                  className="w-full rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40" />
              </label>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 flex gap-2.5 text-[12px] text-amber-800">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Warning: Propagates Platform-Wide</span>
                  Changing the URL will search and replace all instances of this media link across pages, posts, and sections in the database.
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => deleteMedia(selected.id)} className="an-btn an-btn-ghost an-btn-sm text-red-600"><Trash2 size={14} /> Delete</button>
                <button onClick={saveMeta} className="an-btn an-btn-primary an-btn-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibraryPage;

