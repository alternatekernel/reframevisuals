import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CASE_STUDIES } from '../data/expansionPages';
import { Button } from '../components/ui/button';

const CaseStudyDetailPage = () => {
  const { pathname } = useLocation();
  const page = CASE_STUDIES.find((c) => c.path === pathname);

  if (!page) return <div className="max-w-5xl mx-auto px-6 py-24">Case study not found.</div>;

  const canonical = `https://reframevisuals.com${page.path}`;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
      { '@type': 'ListItem', position: 2, name: 'Case Studies', item: 'https://reframevisuals.com/case-studies' },
      { '@type': 'ListItem', position: 3, name: page.h1, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        {/* Case-study detail pages currently share templated placeholder copy.
            Keep them out of the index until each has real client content. */}
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://reframevisuals.com/og-default.jpg" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">{page.h1}</h1>
        <p className="text-black/70 mb-6">{page.description}</p>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border border-black/10 rounded-xl p-4"><p className="text-xs uppercase text-black/50">Client Type</p><p className="font-semibold">Ecommerce Brand</p></div>
          <div className="border border-black/10 rounded-xl p-4"><p className="text-xs uppercase text-black/50">Primary Goal</p><p className="font-semibold">Scale image production</p></div>
          <div className="border border-black/10 rounded-xl p-4"><p className="text-xs uppercase text-black/50">Outcome</p><p className="font-semibold">{page.outcome}</p></div>
        </div>

        <div className="prose prose-lg text-black/75 mb-12">
          <p>
            This case study explores the execution and workflow behind our partnership for the <strong>{page.h1.replace('Case Study: ', '')}</strong> project. The primary focus was establishing a scalable, high-quality image production pipeline that met strict brand guidelines while accelerating time-to-market.
          </p>
          <h3 className="text-xl font-bold text-black mt-8 mb-4">The Challenge</h3>
          <p>
            Prior to Reframe Visuals, the client struggled with inconsistent retouching standards, slow turnaround times, and a lack of predictable quality control. This resulted in frequent revision loops that delayed critical product launches and increased internal operational overhead.
          </p>
          <h3 className="text-xl font-bold text-black mt-8 mb-4">The Solution & Workflow</h3>
          <p>
            We implemented a dedicated production lane featuring custom quality gates and an SLA-backed delivery window. By standardizing the retouching guidelines and establishing a clear feedback loop, we were able to minimize revisions and ensure consistent visual output across all SKUs.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="compact" variant="default" className="font-semibold">
            <Link to="/free-trial">Start free trial</Link>
          </Button>
          <Button asChild size="compact" variant="outline" className="border-black/15 font-semibold">
            <Link to="/book-meeting">Book meeting</Link>
          </Button>
          <Button asChild size="compact" variant="outline" className="border-black/15 font-semibold">
            <Link to="/case-studies">Back to case studies</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CaseStudyDetailPage;
