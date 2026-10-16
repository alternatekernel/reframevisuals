import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Testimonials from '../sections/Testimonials';
import { TESTIMONIALS } from '../data/testimonials';

const reviewsSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Client Testimonials — Reframe Visuals Ecommerce Photo Editing',
  description: 'Read verified reviews from ecommerce brands, fashion labels, and photographers who use Reframe Visuals for background removal, ghost mannequin editing, jewelry retouching, and product photo editing.',
  url: 'https://reframevisuals.com/testimonials',
  publisher: {
    '@type': 'Organization',
    name: 'Reframe Visuals',
    url: 'https://reframevisuals.com',
  },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: TESTIMONIALS.slice(0, 6).map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Review',
        reviewBody: t.quote,
        author: {
          '@type': 'Person',
          name: t.name,
          jobTitle: t.company,
        },
        itemReviewed: {
          '@type': 'Organization',
          name: 'Reframe Visuals',
          url: 'https://reframevisuals.com',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
      },
    })),
  },
};

const STATS = [
  { value: '500+', label: 'Brands served' },
  { value: '5-star', label: 'Average review' },
  { value: '3×+', label: 'Avg. repeat orders' },
  { value: '12h', label: 'Express turnaround' },
];

const TestimonialsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Client Testimonials | Ecommerce Photo Editing Reviews | Reframe Visuals</title>
        <meta
          name="description"
          content="Real reviews from ecommerce brands and photographers who use Reframe Visuals for background removal, ghost mannequin, retouching, and product image editing. From $0.39/image."
        />
        <link rel="canonical" href="https://reframevisuals.com/testimonials" />
        <meta property="og:title" content="Client Testimonials | Reframe Visuals Photo Editing Reviews" />
        <meta property="og:description" content="Read verified reviews from brands and photographers who use Reframe Visuals for ecommerce photo editing." />
        <meta property="og:url" content="https://reframevisuals.com/testimonials" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <script type="application/ld+json">{JSON.stringify(reviewsSchema)}</script>
      </Helmet>

      {/* Page Hero */}
      <section className="bg-white px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14 lg:px-8 lg:pt-20 lg:pb-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-black/40">
            Client reviews
          </p>
          <h1 className="mt-3 text-[36px] font-bold leading-tight tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-[52px] lg:text-[60px]">
            What our clients say
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-black/55">
            Founders, photographers, and catalog teams who trust Reframe Visuals for their product image editing — in their own words.
          </p>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-start rounded-2xl border border-black/[0.08] bg-black/[0.02] px-5 py-4"
              >
                <span className="text-[22px] font-bold leading-none tracking-[-0.04em] text-[var(--color-text-primary)]">
                  {s.value}
                </span>
                <span className="mt-1 text-[12px] font-medium uppercase tracking-[0.1em] text-black/40">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/free-trial"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--color-text-primary)] px-6 text-[14px] font-bold text-white transition-all hover:bg-black active:scale-95"
            >
              Get 3 Free Sample Edits
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/15 px-6 text-[14px] font-bold text-black/70 transition-all hover:border-black/30 hover:text-black active:scale-95"
            >
              See before &amp; after work
            </Link>
          </div>
        </div>
      </section>

      <Testimonials title="People love working with Reframe" />
    </div>
  );
};

export default TestimonialsPage;
