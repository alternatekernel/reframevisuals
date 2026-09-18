import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import { absoluteCanonicalUrl } from '../utils/seo';
import { cx, typography } from '../utils/theme';

const COMPARISONS: Record<string, { title: string; description: string; h1: string; points: string[] }> = {
  'in-house-vs-outsourcing': {
    title: 'In-house vs Outsourced Photo Editing for E-commerce | Reframe Visuals',
    description: 'A practical comparison of in-house editing versus outsourced photo editing for ecommerce teams focused on speed, quality, and total cost.',
    h1: 'In-house vs Outsourced Photo Editing',
    points: [
      'In-house teams provide direct control but are often constrained by headcount and fixed overhead.',
      'Outsourced specialists increase throughput, especially for seasonal spikes and large catalog updates.',
      'Quality consistency depends on process rigor, revision workflows, and quality assurance standards.',
      'A hybrid model often performs best: strategic in-house review with external production scaling.',
    ],
  },
  'clipping-path-vs-background-removal': {
    title: 'Clipping Path vs Background Removal: Which to Use | Reframe Visuals',
    description: 'Understand when to use clipping path versus background removal for ecommerce product images, hard edges, and complex subject detail.',
    h1: 'Clipping Path vs Background Removal',
    points: [
      'Clipping path is optimal for hard-edge products and precise vector-based selections.',
      'Background removal is broader and can include soft edges and transparency handling.',
      'For marketplace consistency, workflows often combine both depending on product category.',
      'Choosing the right method reduces rework and improves listing quality at scale.',
    ],
  },
};

const ServiceComparisonPage: React.FC = () => {
  const { slug } = useParams();
  const comparison = slug ? COMPARISONS[slug] : null;
  if (!comparison || !slug) return <Navigate to="/services" replace />;

  const canonical = absoluteCanonicalUrl(`/compare/${slug}`);

  return (
    <>
      <Helmet>
        <title>{comparison.title}</title>
        <meta name="description" content={comparison.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={comparison.title} />
        <meta property="og:description" content={comparison.description} />
        <meta property="og:url" content={canonical} />
      </Helmet>
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className={cx(typography.eyebrow, "text-[var(--color-brand-primary)] mb-3")}>Reframe Visuals • Decision Guide</p>
        <h1 className="mt-3 text-3xl font-bold text-black md:text-4xl">{comparison.h1}</h1>
        <p className="mt-4 text-base leading-7 text-black/80">{comparison.description}</p>
        <ul className="mt-8 list-disc space-y-3 pl-6 text-base leading-7 text-black/80">
          {comparison.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-2 text-[16px]">
          <Link to="/services/background-removal" className="text-[var(--color-brand-primary)] hover:underline">Background Removal Service</Link>
          <Link to="/services/clipping-path" className="text-[var(--color-brand-primary)] hover:underline">Clipping Path Service</Link>
          <Link to="/services" className="text-[var(--color-brand-primary)] hover:underline">All Services</Link>
        </div>
      </section>
    </>
  );
};

export default ServiceComparisonPage;
