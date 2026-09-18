import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CASE_STUDIES } from '../data/expansionPages';

const CaseStudiesHubPage = () => {
  const title = 'Ecommerce Photo Editing Case Studies | Reframe Visuals';
  const description = 'Real workflow case studies showing how Reframe Visuals improves turnaround, quality consistency, and production reliability for ecommerce brands.';
  const canonical = 'https://reframevisuals.com/case-studies';

  const caseStudySchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ecommerce Photo Editing Case Studies',
    description: 'Real workflow case studies showing how Reframe Visuals improves turnaround, quality consistency, and production reliability.',
    url: canonical,
    numberOfItems: CASE_STUDIES.length,
    itemListElement: CASE_STUDIES.map((study, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Article',
        headline: study.h1,
        description: study.description,
        url: `https://reframevisuals.com${study.path}`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(caseStudySchema)}</script>
      </Helmet>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Case Studies</h1>
        <p className="text-black/70 max-w-3xl mb-10">Evidence-focused case stories from ecommerce image production programs.</p>
        <div className="grid md:grid-cols-2 gap-5">
          {CASE_STUDIES.map((c) => (
            <Link key={c.slug} to={c.path} className="border border-black/10 rounded-2xl p-5 hover:border-black/20 transition-colors">
              <h2 className="font-semibold text-[20px] mb-2">{c.h1}</h2>
              <p className="text-[16px] text-black/65">{c.description}</p>
              <p className="mt-3 text-[16px] text-black font-semibold">Outcome: {c.outcome}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CaseStudiesHubPage;
