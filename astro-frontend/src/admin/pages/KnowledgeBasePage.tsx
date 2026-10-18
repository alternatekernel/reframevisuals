import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, Filter, Plus, FileText, Bookmark, Clock, Eye, ArrowRight, ShieldCheck, Zap, Hash, RefreshCw } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';
import { adminFetch } from '../utils/api';

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  tags?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArticleForm {
  title: string;
  category: string;
  content: string;
  tags: string;
  published: boolean;
}

const emptyArticleForm: ArticleForm = { title: '', category: 'SOP', content: '', tags: '', published: true };

const parseTags = (tags?: string | null) => {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return String(tags).split(',').map(t => t.trim()).filter(Boolean); }
};

export const KnowledgeBasePage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ArticleForm>(emptyArticleForm);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ articles: Article[] }>('/business/knowledge?limit=100');
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadArticles(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadArticles]);

  const filteredArticles = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return articles;
    return articles.filter((article) => [article.title, article.category, article.content, ...parseTags(article.tags)].some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [articles, searchQuery]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((article) => map.set(article.category, (map.get(article.category) || 0) + 1));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [articles]);

  const createArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Article title and content are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/business/knowledge', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category.trim() || 'SOP',
          content: form.content.trim(),
          tags: JSON.stringify(form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)),
          published: form.published,
        }),
      });
      setForm(emptyArticleForm);
      setShowCreate(false);
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader title="Knowledge Base" description="SOPs, training documents, and platform guidelines." parentPage="Knowledge Base" />
      {error && <div className="rounded-2xl border border-[var(--admin-red)]/20 bg-[var(--admin-red-dim)] px-5 py-4 text-[13px] font-bold text-[var(--admin-red)]">{error}</div>}

      <div className="flex flex-wrap items-center justify-between gap-6 px-1">
         <div className="relative group flex-1 max-w-2xl"><Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)] group-focus-within:text-[var(--admin-accent)] transition-colors" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search articles..." className="w-full pl-14 pr-6 py-4 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl text-[15px] font-bold text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]/20 transition-all shadow-2xl" /></div>
         <div className="flex items-center gap-3"><button className="flex items-center gap-2 px-6 py-4 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-2xl text-[13px] font-black hover:bg-[var(--admin-surface-2)] transition-all uppercase tracking-widest"><Filter size={18} /> FILTER</button><button onClick={loadArticles} className="flex items-center gap-2 px-6 py-4 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-2xl text-[13px] font-black hover:bg-[var(--admin-surface-2)] transition-all uppercase tracking-widest"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> SYNC</button><button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-8 py-4 bg-[var(--admin-accent)] text-black rounded-2xl text-[13px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(232,148,58,0.3)] uppercase tracking-tighter"><Plus size={20} strokeWidth={3} /> NEW ARTICLE</button></div>
      </div>

      {loading ? <div className="p-12 text-center text-[var(--admin-text-3)]">Loading knowledge base...</div> : filteredArticles.length === 0 ? <div className="p-12 text-center text-[var(--admin-text-3)]">No knowledge articles found.</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredArticles.map(a => {
            const tags = parseTags(a.tags);
            return (
              <div key={a.id} className="group bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] p-8 shadow-xl hover:border-[var(--admin-accent)]/30 transition-all flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><BookOpen size={60} /></div>
                <div className="flex items-start justify-between mb-6"><div className="p-3 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] rounded-2xl text-[var(--admin-accent)] shadow-xl group-hover:scale-110 transition-transform"><FileText size={24} /></div><span className="px-2 py-0.5 bg-[var(--admin-surface-3)] text-[var(--admin-text-3)] text-[9px] font-black rounded-md border border-[var(--admin-border)] uppercase tracking-widest">{tags[0] || 'DOC'}</span></div>
                <div className="space-y-2 mb-8"><div className="text-[10px] font-black text-[var(--admin-accent)] opacity-80 uppercase tracking-widest">{a.category}</div><h4 className="text-[20px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tight leading-tight uppercase group-hover:text-[var(--admin-accent)] transition-colors line-clamp-2">{a.title}</h4><p className="text-[12px] text-[var(--admin-text-3)] line-clamp-3">{a.content}</p></div>
                <div className="mt-auto pt-6 border-t border-[var(--admin-border)] flex items-center justify-between"><div className="flex items-center gap-4"><div className="flex items-center gap-1.5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-tighter"><Clock size={12} /> {new Date(a.updatedAt).toLocaleDateString()}</div><div className="flex items-center gap-1.5 text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-tighter"><Eye size={12} /> {a.published ? 'LIVE' : 'DRAFT'}</div></div><button className="p-2 text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all"><ArrowRight size={18} /></button></div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
         <div className="lg:col-span-2 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-10"><div><h3 className="text-[24px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter uppercase leading-none mb-2">Document Status</h3><p className="text-[14px] text-[var(--admin-text-3)] font-medium opacity-70">Article counts and sync status.</p></div><div className="p-4 bg-[var(--admin-green-dim)] rounded-2xl border border-[var(--admin-green)]/20 text-[var(--admin-green)] font-black text-[18px] tracking-widest shadow-lg shadow-[var(--admin-green)]/10">LIVE</div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{[{ label: 'Total Articles', value: `${articles.length} Articles`, icon: <Bookmark size={18} /> }, { label: 'Data Status', value: 'COMPLIANT', icon: <ShieldCheck size={18} /> }, { label: 'Search Status', value: 'Indexed', icon: <Zap size={18} /> }].map((stat, i) => (<div key={i} className="bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-3xl p-6 shadow-inner group/stat hover:border-[var(--admin-accent)]/30 transition-all"><div className="text-[var(--admin-text-3)] group-hover/stat:text-[var(--admin-accent)] transition-colors mb-4">{stat.icon}</div><div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-1">{stat.label}</div><div className="text-[18px] font-black text-[var(--admin-text)] tracking-tight uppercase leading-none">{stat.value}</div></div>))}</div>
         </div>
         <div className="bg-gradient-to-br from-[var(--admin-surface-2)] to-[var(--admin-bg)] border border-[var(--admin-border)] rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between group overflow-hidden relative"><div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[var(--admin-accent)]/5 rounded-full blur-3xl group-hover:bg-[var(--admin-accent)]/10 transition-all duration-1000" /><div className="relative z-10"><h4 className="flex items-center gap-3 text-[20px] font-black text-[var(--admin-text)] tracking-tighter uppercase mb-6"><Hash size={24} className="text-[var(--admin-accent)]" /> Global Categorization</h4><div className="space-y-4">{categories.slice(0, 4).map((cat, i) => (<div key={i} className="space-y-2"><div className="flex items-center justify-between text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">{cat.name} <span>{cat.count} Docs</span></div><div className="h-1.5 w-full bg-[var(--admin-surface-3)] rounded-full overflow-hidden"><div className={cx('h-full rounded-full transition-all duration-1000', i === 0 ? 'bg-[var(--admin-green)]' : 'bg-[var(--admin-accent)]')} style={{ width: `${Math.min(100, cat.count * 20)}%` }} /></div></div>))}</div></div><button className="mt-12 py-4 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-[var(--admin-accent)] hover:text-black transition-all shadow-xl active:scale-[0.98] relative z-10">View All Categories</button></div>
      </div>


      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={createArticle} className="w-full max-w-2xl rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h3 className="text-[20px] font-black uppercase text-[var(--admin-text)]">New Knowledge Document</h3><p className="text-[12px] text-[var(--admin-text-3)]">Create a live article in the knowledge base.</p></div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-[var(--admin-border)] px-3 py-2 text-[12px] font-black text-[var(--admin-text-3)]">CLOSE</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)] sm:col-span-2">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)]">Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)]">Tags<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="qc, onboarding, sop" className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="space-y-1 text-[11px] font-black uppercase tracking-widest text-[var(--admin-text-3)] sm:col-span-2">Content<textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={7} className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-3)] px-4 py-3 text-[13px] text-[var(--admin-text)] outline-none" /></label>
              <label className="flex items-center gap-3 text-[12px] font-black uppercase tracking-widest text-[var(--admin-text-3)] sm:col-span-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publish immediately</label>
            </div>
            <button disabled={saving} className="mt-6 w-full rounded-xl bg-[var(--admin-accent)] px-5 py-3 text-[13px] font-black uppercase text-black disabled:opacity-50">{saving ? 'Saving...' : 'Save Document'}</button>
          </form>
        </div>
      )}
    </div>
  );
};
