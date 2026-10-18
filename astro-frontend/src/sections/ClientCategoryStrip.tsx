import ScrollReveal from '../components/common/ScrollReveal';

// Named clients — add logoUrl (Cloudinary or absolute URL) when available
const NAMED_CLIENTS = [
  {
    name: 'BOMBER',
    detail: 'Bold Streetwear',
    websiteUrl: 'https://bomberclothing.com/',
    logoUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781635028/reframe-assets/bomber-logo-2026-06-16.jpg',
  },
  {
    name: 'PUPPACK',
    detail: 'Pet Accessories · USA',
    websiteUrl: 'https://puppack.co/',
    logoUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781635030/reframe-assets/pup-pack-logo-2026-06-16.jpg',
  },
];

const ClientLogoRow = () => (
  <div className="mx-auto mb-8 flex w-full max-w-3xl flex-col items-center gap-5 px-4">
    <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-black/60">
      Trusted by
    </p>

    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 sm:gap-x-16">
      {NAMED_CLIENTS.map((client) => (
        <a
          key={client.name}
          href={client.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${client.name} website`}
          className="flex min-w-[150px] items-center justify-center rounded-2xl px-4 py-2 transition duration-200 hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          itemScope
          itemType="https://schema.org/Organization"
        >
          <meta itemProp="name" content={client.name} />
          <meta itemProp="url" content={client.websiteUrl} />
          <div className="flex flex-col items-center gap-2">
            {client.logoUrl ? (
              <img
                src={client.logoUrl}
                alt={`${client.name} ecommerce photo editing clients - Reframe Visuals`}
                itemProp="logo"
                loading="eager"
                className="h-12 w-auto object-contain sm:h-14"
              />
            ) : (
              <span className="font-black tracking-[0.15em] text-[18px] text-black/60 uppercase">
                {client.name}
              </span>
            )}
            {client.detail && (
              <span className="text-[12px] font-medium tracking-[0.08em] text-black/35 uppercase">
                {client.detail}
              </span>
            )}
          </div>
        </a>
      ))}
    </div>
  </div>
);

const PLATFORMS = [
  'Amazon',
  'Etsy',
  'ASOS Marketplace',
  'Depop',
  'Zalando',
  'eBay',
  'WooCommerce',
  'BigCommerce',
  'Squarespace',
];

const CATEGORIES = [
  'Jewelry & Fine Accessories',
  'Apparel & Fashion',
  'Footwear',
  'Homewares & Furniture',
  'Beauty & Skincare',
  'Consumer Electronics',
  'Bags & Leather Goods',
  'Sports & Outdoor',
  'Toys & Kids',
  'Pet Products',
];

const Separator = () => (
  <span className="mx-6 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-black/20 self-center" />
);

const ScrollTrack = ({
  items,
  reverse = false,
  dim = false,
}: {
  items: string[];
  reverse?: boolean;
  dim?: boolean;
}) => {
  // 8 copies ensures it spans ultra-wide monitors. -12.5% translates exactly 1 copy, looping perfectly.
  const multiplied = Array(8).fill(items).flat();

  return (
    <div className="relative overflow-hidden">
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-white to-transparent" />

      <div
        className="flex items-center w-max"
        style={{
          animation: `${reverse ? 'marquee-right' : 'marquee-left'} 45s linear infinite`,
          willChange: 'transform',
        }}
      >
        {multiplied.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center shrink-0">
            <span
              className={`whitespace-nowrap font-sans text-[17px] font-medium tracking-[0.02em] ${
                dim ? 'text-black/28' : 'text-black/50'
              }`}
            >
              {item}
            </span>
            <Separator />
          </span>
        ))}
      </div>
    </div>
  );
};

const ClientCategoryStrip = () => {
  return (
    <ScrollReveal variant="fade-slide" delay={0.1}>
      <section className="bg-white pt-6 pb-14 overflow-hidden">
        <ClientLogoRow />

        <div className="mb-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-black/25">
            We work across
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <ScrollTrack items={PLATFORMS} />
          <ScrollTrack items={CATEGORIES} reverse dim />
        </div>
      </section>
    </ScrollReveal>
  );
};

export default ClientCategoryStrip;
