import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import { INSIGHT_ARTICLES } from '../data/expansionPages';

const canonical = 'https://reframevisuals.com/resources';

const breadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
    { '@type': 'ListItem', position: 2, name: 'Resources', item: canonical },
  ],
};

const ResourcesPage = () => (
  <div className="min-h-screen bg-white">
    <Helmet>
      <title>Ecommerce Photo Editing Resources & Guides | Reframe Visuals</title>
      <meta
        name="description"
        content="Practical guides on background removal, clipping path, ghost mannequin editing, jewelry retouching, and ecommerce image production workflows from Reframe Visuals."
      />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content="Ecommerce Photo Editing Resources & Guides | Reframe Visuals" />
      <meta
        property="og:description"
        content="Practical guides on background removal, clipping path, ghost mannequin editing, jewelry retouching, and ecommerce image production workflows."
      />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
    </Helmet>

    <section className="max-w-4xl mx-auto px-6 py-20">
      <p className="text-[12px] font-black uppercase tracking-[0.18em] text-black/30 mb-3">Resources</p>
      <h1 className="text-[36px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-4">
        Ecommerce Image Production Guides
      </h1>
      <p className="text-[16px] text-black/60 leading-relaxed max-w-2xl mb-12">
        Practical guides on clipping paths, background removal, ghost mannequin, retouching workflows, and production scaling — written by editors who've worked with top ecommerce brands.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {INSIGHT_ARTICLES.map((article) => (
          <Link
            key={article.slug}
            to={article.path}
            className="group flex items-start justify-between rounded-2xl border border-black/8 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
          >
            <div className="min-w-0 pr-3">
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-snug mb-1.5">
                {article.h1}
              </h2>
              <p className="text-[13px] text-black/55 leading-relaxed line-clamp-2">{article.description}</p>
            </div>
            <ArrowRight
              size={14}
              className="shrink-0 mt-1 text-black/25 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/60"
            />
          </Link>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-black transition-colors"
        >
          View All Services <ArrowRight size={14} />
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-5 py-2.5 text-[14px] font-semibold text-black hover:bg-black/5 transition-colors"
        >
          Read the Blog <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  </div>
);

export default ResourcesPage;
