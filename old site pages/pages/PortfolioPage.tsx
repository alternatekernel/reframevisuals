import { Helmet } from 'react-helmet-async';
import { SERVICES } from '../data/services';
import PortfolioHero from '../sections/portfolio/PortfolioHero';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx, tokens } from '../utils/theme';
import Testimonials from '../sections/Testimonials';
import PortfolioAbout from '../sections/portfolio/PortfolioAbout';

const showcase = SERVICES.filter((s) => !s.hidden && s.beforeImage && s.afterImage);

const imageGallerySchema = {
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: 'Photo Editing Before & After Portfolio — Client Work by Reframe Visuals',
  description: 'Real client before and after photo editing examples produced by Reframe Visuals human editors. Services shown include clipping path, background removal, ghost mannequin, shadow creation, color correction, jewelry retouching, garment retouching, and model retouching. All images are actual production outputs delivered to ecommerce and fashion clients.',
  url: 'https://reframevisuals.com/portfolio',
  publisher: {
    '@type': 'Organization',
    name: 'Reframe Visuals',
    url: 'https://reframevisuals.com',
  },
  image: showcase.map((s) => [
    {
      '@type': 'ImageObject',
      name: `${s.name} — before editing (client work sample)`,
      description: `Unedited source image submitted by a client for ${s.name} service. ${s.description} Best for: ${s.bestFor}.`,
      contentUrl: s.beforeImage,
      encodingFormat: 'image/jpeg',
    },
    {
      '@type': 'ImageObject',
      name: `${s.name} — after editing (client work sample)`,
      description: `Finished output delivered to client after ${s.name} by Reframe Visuals human editors. Starting at $${s.price.toFixed(2)} per image.`,
      contentUrl: s.afterImage,
      encodingFormat: 'image/jpeg',
    },
  ]).flat(),
};

const PortfolioPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Before & After Photo Editing Portfolio | Clipping, Retouching, Ghost Mannequin | Reframe Visuals</title>
        <meta
          name="description"
          content="See real before and after results from our photo editing services — clipping path, background removal, ghost mannequin, retouching, and jewelry editing. Human editors, from $0.39/image."
        />
        <link rel="canonical" href="https://reframevisuals.com/portfolio" />
        <meta property="og:title" content="Before & After Portfolio | Ecommerce Photo Editing | Reframe Visuals" />
        <meta property="og:description" content="Real before and after examples for clipping path, background removal, ghost mannequin, retouching, and jewelry editing." />
        <meta property="og:url" content="https://reframevisuals.com/portfolio" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <script type="application/ld+json">{JSON.stringify(imageGallerySchema)}</script>
      </Helmet>
      <PortfolioHero />

      {/* Context note for AI crawlers and screen readers */}
      <p className="sr-only">
        Reframe Visuals produced every image here for paying clients. Side-by-side before and after comparisons of photo editing services applied to actual client images. Production outputs delivered to ecommerce brands, Amazon sellers, fashion labels, and agencies — not stock photos or mock-ups.
      </p>

      <section
        aria-label="Before and after photo editing examples — real client work"
        className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-16 grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {showcase.map((service) => (
          <article
            key={service.id}
            aria-label={`${service.name} — client work before and after example`}
            className="group rounded-[24px] border border-black/10 bg-white p-1 shadow-[0_14px_40px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          >
            <div className="grid grid-cols-2 rounded-[20px] overflow-hidden border border-black/5">
              <div className="relative">
                <img
                  src={service.beforeImage}
                  alt={`${service.name} — unedited client image before photo editing`}
                  className="w-full aspect-[4/5] object-contain bg-[var(--color-bg-secondary)]"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-black/75 text-white px-2 py-1 rounded-full">Before</span>
              </div>
              <div className="relative">
                <img
                  src={service.afterImage}
                  alt={`${service.name} — finished client image after photo editing by Reframe Visuals`}
                  className="w-full aspect-[4/5] object-contain bg-[var(--color-bg-secondary)]"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-white/90 text-[var(--color-text-primary)] px-2 py-1 rounded-full">After</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
                <Link
                  to={`/services/${service.id}`}
                  className="group inline-flex items-center gap-1.5 transition-all"
                >
                  <span className="relative">
                    {service.name}
                    <span className={cx(tokens.interactiveUnderline, "opacity-5")} />
                  </span>
                  <ArrowRight size={16} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/70 shrink-0" />
                </Link>
              </h3>
              <p className="text-[14px] text-black/55 mt-3 leading-relaxed">{service.description}</p>
              <p className="text-[13px] text-black/40 mt-1">Best for: {service.bestFor}</p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-[15px] font-medium text-black/70">Starting at ${service.price.toFixed(2)} per image</p>
                <Link
                  to={`/order/new?serviceId=${service.id}`}
                  className="opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 text-[12px] font-semibold text-white bg-black px-3 py-1.5 rounded-full hover:bg-black/80 shrink-0"
                >
                  Order Now
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <PortfolioAbout />
      <Testimonials />

    </div>
  );
};

export default PortfolioPage;
