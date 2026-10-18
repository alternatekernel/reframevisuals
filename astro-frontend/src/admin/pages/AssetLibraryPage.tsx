import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload, Grid, List, Search, Image as ImageIcon, Trash2, Download, Layout, Box, Hash, RefreshCw } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  url: string;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AssetForm {
  name: string;
  type: string;
  category: string;
  url: string;
  tags: string;
}

const emptyAssetForm: AssetForm = { name: '', type: 'image', category: 'general', url: '', tags: '' };

const isImage = (asset: Asset) => asset.type?.toLowerCase().includes('image') || /\.(png|jpe?g|webp|gif|svg)$/i.test(asset.url || asset.name);
const formatTags = (tags?: string | null) => {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return []; }
};

export const AssetLibraryPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyAssetForm);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ assets: Asset[]; totalCount: number }>('/assets');
      setAssets(data.assets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAssets(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return assets;
    return assets.filter((asset) => [asset.name, asset.type, asset.category, ...formatTags(asset.tags)].some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [assets, searchQuery]);

  const createAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setError('Asset name and URL are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type.trim() || 'image',
          category: form.category.trim() || 'general',
          url: form.url.trim(),
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      setForm(emptyAssetForm);
      setShowUpload(false);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  const deleteAsset = async (asset: Asset) => {
    if (!confirm(`Delete ${asset.name}?`)) return;
    try {
      await adminFetch(`/assets/${asset.id}`, { method: 'DELETE' });
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader title="Asset Repository" description="Unified storage for all platform media, documents, and high-fidelity output." parentPage="Content / Assets" />
      {error && <div className="rounded-2xl border border-[var(--admin-red)]/20 bg-[var(--admin-red-dim)] px-5 py-4 text-[13px] font-bold text-[var(--admin-red)]">{error}</div>}

      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group"><Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)] group-focus-within:text-[var(--admin-accent)] transition-colors" /><input type="text" placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 pr-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)]/50 focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all w-64" /></div>
            <div className="flex items-center gap-1 bg-[var(--admin-surface-3)] p-1 rounded-xl border border-[var(--admin-border)] shadow-inner">
               <button onClick={() => setViewMode('grid')} className={cx('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-[var(--admin-accent)] text-black' : 'text-[var(--admin-text-3)] hover:text-[var(--admin-text)]')}><Grid size={16} /></button>
               <button onClick={() => setViewMode('list')} className={cx('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-[var(--admin-accent)] text-black' : 'text-[var(--admin-text-3)] hover:text-[var(--admin-text)]')}><List size={16} /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAssets} className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[13px] font-bold text-[var(--admin-text-2)]"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> SYNC</button>
            <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[var(--admin-accent)] text-black rounded-xl text-[13px] font-black hover:bg-[var(--admin-accent)]/90 transition-all shadow-[0_0_20px_rgba(255,191,0,0.2)]"><Upload size={16} strokeWidth={3} /> UPLOAD ASSET</button>
          </div>
        </div>

        <div className="p-8">
          {loading ? <div className="p-12 text-center text-[var(--admin-text-3)]">Loading assets...</div> : filteredAssets.length === 0 ? <div className="p-12 text-center text-[var(--admin-text-3)]">No assets found.</div> : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="group bg-[var(--admin-surface-2)]/50 border border-[var(--admin-border)] rounded-3xl p-4 hover:border-[var(--admin-accent)]/30 transition-all relative overflow-hidden shadow-lg">
                  <div className="aspect-square bg-[var(--admin-surface-3)] rounded-2xl mb-4 flex items-center justify-center border border-[var(--admin-border)] relative overflow-hidden group-hover:border-[var(--admin-accent)]/20">
                    {isImage(asset) ? <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-[var(--admin-text-3)] group-hover:text-[var(--admin-accent)] transition-all group-hover:scale-110" />}
                  </div>
                  <div><div className="text-[14px] font-black text-[var(--admin-text)] truncate">{asset.name}</div><div className="flex items-center justify-between mt-1"><span className="text-[11px] font-[var(--admin-font-mono)] text-[var(--admin-text-3)] uppercase">{asset.type} • {asset.category}</span><button onClick={() => deleteAsset(asset)} className="p-1.5 text-[var(--admin-text-3)] hover:text-[var(--admin-red)] opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-[var(--admin-red)]/20 hover:bg-[var(--admin-red)]/5 rounded-lg"><Trash2 size={14} /></button></div></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="group flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--admin-surface-2)]/50 border border-[var(--admin-border)] rounded-2xl hover:border-[var(--admin-accent)]/30 transition-all shadow-sm">
                  <div className="flex items-center gap-4"><div className="w-10 h-10 bg-[var(--admin-surface-3)] rounded-xl flex items-center justify-center border border-[var(--admin-border)] group-hover:border-[var(--admin-accent)]/20">{isImage(asset) ? <img src={asset.url} alt={asset.name} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon size={18} className="text-[var(--admin-text-3)]" />}</div><div><div className="text-[14px] font-black text-[var(--admin-text)]">{asset.name}</div><div className="text-[11px] font-medium text-[var(--admin-text-3)] uppercase tracking-wider">{asset.type} • {asset.category}</div></div></div>
                  <div className="flex items-center gap-2"><a href={asset.url} target="_blank" rel="noreferrer" className="p-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] transition-all"><Download size={16} /></a><button onClick={() => deleteAsset(asset)} className="p-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-3)] hover:text-[var(--admin-red)] transition-all"><Trash2 size={16} /></button></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-[var(--admin-surface-2)]/30 border-t border-[var(--admin-border)] flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-8"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-[var(--admin-accent-dim)] text-[var(--admin-accent)]"><Box size={16} /></div><div><div className="text-[12px] font-black text-[var(--admin-text)]">{assets.length} Assets Stored</div><div className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase">Live repository</div></div></div><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-[var(--admin-blue-dim)] text-[var(--admin-blue)]"><Hash size={16} /></div><div><div className="text-[12px] font-black text-[var(--admin-text)]">{new Set(assets.map(a => a.category)).size} Categories</div><div className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase">Global Index</div></div></div></div>
           <button className="flex items-center gap-2 text-[11px] font-black text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] transition-all uppercase tracking-widest"><Layout size={14} /> View Storage Report</button>
        </div>
      </div>


      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={createAsset} className="w-full max-w-xl rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h3 className="text-[20px] font-black uppercase text-[var(--admin-text)]">Upload Asset</h3><p className="text-[12px] text-[var(--admin-text-3)]">Register a hosted asset URL in the live repository.</p></div>
              <button type="button" onClick={() => setShowUpload(false)} className="rounded-xl border border-[var(--admin-border)] px-3 py-2 text-[12px] font-black text-[var(--admin-text-3)]">CLOSE</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)]">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)]">Type<input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)]">Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)]">Tags<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="hero, ecommerce, bg" className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)] sm:col-span-2">URL<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
            </div>
            <button disabled={saving} className="mt-6 w-full rounded-xl bg-[var(--admin-accent)] px-5 py-3 text-[13px] font-black uppercase text-black disabled:opacity-50">{saving ? 'Saving...' : 'Save Asset'}</button>
          </form>
        </div>
      )}
    </div>
  );
};
