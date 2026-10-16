import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CmsPage {
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL
  || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

const CmsPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetch(`${API_BASE}/blog/pages/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!active) return;
        if (data?.page) { setPage(data.page); setStatus('ready'); }
        else setStatus('notfound');
      })
      .catch(() => active && setStatus('notfound'));
    return () => { active = false; };
  }, [slug]);

  if (status === 'loading') {
    return <div className="mx-auto max-w-3xl px-5 py-24 text-center text-black/40">Loading…</div>;
  }

  if (status === 'notfound' || !page) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-2xl font-bold text-black/80">Page not found</h1>
        <p className="mt-2 text-black/50">The page you’re looking for doesn’t exist.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <Helmet>
        <title>{`${page.metaTitle || page.title} | Reframe Visuals`}</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
      </Helmet>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black">{page.title}</h1>
      {page.excerpt && <p className="mt-4 text-lg text-black/55">{page.excerpt}</p>}

      {page.coverImage && (
        <img src={page.coverImage} alt={page.title} className="mt-8 w-full rounded-2xl object-cover" />
      )}

      <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-semibold prose-a:text-black">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content}</ReactMarkdown>
      </div>
    </article>
  );
};

export default CmsPageView;
