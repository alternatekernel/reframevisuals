import React, { useCallback, useEffect, useState } from 'react';
import { Link2, Save } from 'lucide-react';
import { adminFetch } from '../utils/api';
import { useToast } from '../ToastContext';

const STRUCTURES = [
  { value: 'slug', label: 'Post name', example: '/blog/my-post' },
  { value: 'category-slug', label: 'Category + name', example: '/blog/services/my-post' },
];

export const PermalinksPage: React.FC = () => {
  const { showToast } = useToast();
  const [base, setBase] = useState('blog');
  const [structure, setStructure] = useState('slug');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ settings: Record<string, string> }>('/cms/settings');
      setBase(data.settings?.blog_permalink_base || 'blog');
      setStructure(data.settings?.blog_permalink_structure || 'slug');
    } catch { /* defaults */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch('/cms/settings', {
        method: 'PUT',
        body: JSON.stringify({
          blog_permalink_base: base.trim().replace(/^\/+|\/+$/g, '') || 'blog',
          blog_permalink_structure: structure,
        }),
      });
      showToast('Saved', 'Permalink settings updated', 'success');
    } catch (err) {
      showToast('Error', err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cleanBase = base.trim().replace(/^\/+|\/+$/g, '') || 'blog';
  const preview = structure === 'category-slug'
    ? `/${cleanBase}/services/my-post`
    : `/${cleanBase}/my-post`;

  return (
    <div className="space-y-5">
      <div className="an-page-header">
        <div className="an-page-title">
          <span className="ph-icon"><Link2 size={16} strokeWidth={2.5} /></span>
          Permalinks
        </div>
        <div className="an-page-desc">Control the URL structure for blog posts.</div>
      </div>

      {loading ? (
        <div className="an-card p-10 text-center text-sm text-[#888]">Loading…</div>
      ) : (
        <div className="an-card p-5 max-w-2xl space-y-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Blog base path</span>
            <div className="flex items-center gap-1 text-[13px] text-[var(--an-text2)]">
              <span>/</span>
              <input value={base} onChange={(e) => setBase(e.target.value)}
                className="w-48 rounded-lg border border-[var(--an-border)] px-3 py-2 text-[13px] outline-none focus:border-black/40" />
            </div>
          </label>

          <div>
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#777]">Structure</span>
            <div className="space-y-2">
              {STRUCTURES.map((s) => (
                <label key={s.value} className="flex items-center gap-3 rounded-lg border border-[var(--an-border)] px-3 py-2.5 cursor-pointer hover:bg-black/[0.04]">
                  <input type="radio" name="structure" checked={structure === s.value} onChange={() => setStructure(s.value)} />
                  <span className="text-[13px] font-medium text-[var(--an-text)]">{s.label}</span>
                  <code className="ml-auto text-[12px] text-[var(--an-text2)]">{s.example}</code>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-black/[0.05] px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-[#777] mb-1">Preview</div>
            <code className="text-[13px] text-[var(--an-text)]">{preview}</code>
          </div>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="an-btn an-btn-primary an-btn-sm"><Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermalinksPage;
