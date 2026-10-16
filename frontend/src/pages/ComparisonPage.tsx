import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  reframe: string;
  competitor: string;
  reframeWins: boolean | null;
}

interface ComparisonData {
  // Used only in meta tags — never rendered in the visible UI
  competitorName: string;
  // Generic label shown in the visible UI instead of the competitor name
  competitorLabel: string;
  h1: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  directAnswer: string;
  tableRows: ComparisonRow[];
  reasons: Array<{ heading: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
}

const COMPARISONS: Record<string, ComparisonData> = {
  '/pixelz-alternative': {
    competitorName: 'Pixelz',
    competitorLabel: 'Automated Platforms',
    h1: 'More Human Control, Lower Per-Image Cost',
    intro: 'Brands switching from automated editing platforms typically want more direct communication, faster QA feedback, and pricing that scales without enterprise contracts. Reframe Visuals is built for exactly this.',
    metaTitle: 'Pixelz Alternative | Human-Reviewed Ecommerce Photo Editing from $0.39',
    metaDescription: 'Looking for a Pixelz alternative? Reframe Visuals offers manual Pen Tool editing, 12h turnaround, dual-stage QA, and 3 free sample edits — starting from $0.39/image.',
    canonical: 'https://reframevisuals.com/pixelz-alternative',
    directAnswer: 'Reframe Visuals combines manual Photoshop editing with AI-assisted workflows, offering 12h express turnaround, dual-stage QA review, and 3 free sample edits — starting from $0.39 per image for background removal and clipping path.',
    tableRows: [
      { feature: 'Starting price', reframe: 'From $0.39/image', competitor: 'Higher platform pricing', reframeWins: true },
      { feature: 'Free sample edits', reframe: '3 images edited free', competitor: 'No free trial', reframeWins: true },
      { feature: 'Editing method', reframe: 'Manual Pen Tool on every image', competitor: 'Automated + spot-check', reframeWins: true },
      { feature: 'QA review', reframe: 'Dual-stage manual checklist', competitor: 'Platform QA process', reframeWins: true },
      { feature: 'Turnaround options', reframe: '12h, 24h, 48h, 72h', competitor: 'Fixed SLA tiers', reframeWins: null },
      { feature: 'Revision policy', reframe: 'Unlimited revisions included', competitor: 'Platform-based', reframeWins: true },
      { feature: 'Account support', reframe: 'Direct account contact', competitor: 'Ticketing system', reframeWins: true },
      { feature: 'Ghost mannequin', reframe: 'Full specialist service', competitor: 'Available', reframeWins: null },
      { feature: 'Jewelry retouching', reframe: 'Specialist service', competitor: 'General service', reframeWins: true },
    ],
    reasons: [
      { heading: 'No contract. No minimum order.', body: 'Reframe Visuals works on a per-image basis. Upload 10 images or 10,000 — the per-image price stays consistent without enterprise lock-in or platform subscription fees.' },
      { heading: 'Human editing on every image.', body: 'Every image goes through a trained Photoshop editor who manually traces edges with the Pen Tool. AI assists with speed but humans deliver the precision. Automated platforms cannot match this for complex products.' },
      { heading: 'Three free edits before you pay anything.', body: 'Test the quality on your actual products before placing a paid order. Upload 3 images, review the result, and decide. No card required to start.' },
      { heading: 'Direct communication, not ticketing.', body: 'Get direct contact with the team. Revisions are clear, fast, and communicated without platform intermediaries. Most customers who switch cite faster feedback loops as the main reason.' },
    ],
    faqs: [
      { q: 'Is Reframe Visuals cost-competitive with automated editing platforms?', a: 'Reframe Visuals starts from $0.39 per image for background removal and clipping path. Most customers find it more cost-effective for mixed-service catalogs where human precision reduces revision rounds.' },
      { q: 'Can Reframe Visuals handle the same volume?', a: 'Yes. Reframe Visuals supports catalog-scale production with batch workflows. For high-volume requirements, contact the team for a custom capacity and pricing review.' },
      { q: 'What service types are covered?', a: 'Background removal, clipping path, ghost mannequin, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, and AI product photography.' },
    ],
  },
  '/clipping-path-india-alternative': {
    competitorName: 'Clipping Path India',
    competitorLabel: 'Offshore Services',
    h1: 'Stricter QA, Faster Communication',
    intro: 'Brands switching from offshore editing services often deal with inconsistent QA, slow revision turnaround, and lack of dedicated account management. Reframe Visuals is built around exactly these gaps.',
    metaTitle: 'Clipping Path India Alternative | Dual-Stage QA, Dedicated Account Support',
    metaDescription: 'Looking for a Clipping Path India alternative? Reframe Visuals offers manual Pen Tool clipping, dual-stage QA, dedicated account management, and 3 free sample edits — from $0.39/image.',
    canonical: 'https://reframevisuals.com/clipping-path-india-alternative',
    directAnswer: 'Reframe Visuals offers hand-drawn clipping paths with stricter dual-stage QA, faster revision turnaround, dedicated account contact, and 3 free sample edits before any paid order.',
    tableRows: [
      { feature: 'Starting price', reframe: 'From $0.39/image', competitor: 'From $0.39–$0.49/image', reframeWins: null },
      { feature: 'Free sample edits', reframe: '3 images edited free', competitor: 'Not typically offered', reframeWins: true },
      { feature: 'QA process', reframe: 'Dual-stage manual checklist', competitor: 'Basic QC check', reframeWins: true },
      { feature: 'Revision turnaround', reframe: 'Fast, direct communication', competitor: 'Queue-based', reframeWins: true },
      { feature: 'Dedicated account contact', reframe: 'Yes, direct', competitor: 'Queue-based support', reframeWins: true },
      { feature: 'Bulk capacity', reframe: 'Full catalog batches', competitor: 'High volume', reframeWins: null },
      { feature: 'Ghost mannequin', reframe: 'Specialist service', competitor: 'Available', reframeWins: null },
      { feature: 'File transfer', reframe: 'Drive, Dropbox, App Sync', competitor: 'FTP/email', reframeWins: true },
    ],
    reasons: [
      { heading: 'Stricter QA means fewer revision rounds.', body: 'Every image goes through a dual-stage manual review: the primary editor completes the task, then a senior editor verifies against a service-specific QA checklist before delivery. Problems are caught before they reach your catalog.' },
      { heading: 'Faster, direct revision communication.', body: 'When a revision is needed, you communicate directly — no queue, no delay. Most revisions are completed and redelivered same-day, which is the standard customers cite when switching from offshore platforms.' },
      { heading: 'Modern file transfer, not just FTP.', body: 'Reframe Visuals accepts images via Google Drive, Dropbox, automated workflows, or direct upload. No FTP setup required. This reduces the friction of large catalog batch handoffs.' },
      { heading: 'Test quality before volume commitment.', body: 'Reframe Visuals offers 3 free sample edits so you can test edge quality, clipping precision, and consistency on your actual products before placing any paid order.' },
    ],
    faqs: [
      { q: 'How does the QA process compare to offshore services?', a: 'Reframe Visuals applies a dual-stage manual review checklist to every batch. This reduces inconsistency compared to basic QC systems used by volume-focused offshore services where a primary check is the only gate.' },
      { q: 'Does Reframe Visuals support high-volume clipping path orders?', a: 'Yes. Reframe Visuals handles catalog-scale production. For large batches above 500 images per day, contact the team directly for custom volume pricing and capacity confirmation.' },
      { q: 'Can I migrate my existing style references to Reframe Visuals?', a: 'Yes. Upload your existing reference images, style specs, and output requirements. The team will match your established production standard and confirm consistency before processing your full catalog.' },
    ],
  },
  '/cutoutwiz-alternative': {
    competitorName: 'CutOutWiz',
    competitorLabel: 'Automated Tools',
    h1: 'Manual Precision for Complex Products',
    intro: 'Brands moving away from automated cutout tools typically need more than AI processing — they need consistent quality on jewelry, apparel, and multi-part products where automation falls short.',
    metaTitle: 'CutOutWiz Alternative | Manual Pen Tool Editing for Ecommerce Products',
    metaDescription: 'Looking for a CutOutWiz alternative? Reframe Visuals uses manual Pen Tool editing on every image — better for jewelry, apparel, ghost mannequin, and complex products with fine edges.',
    canonical: 'https://reframevisuals.com/cutoutwiz-alternative',
    directAnswer: 'Reframe Visuals uses manual Pen Tool editing and human dual-stage QA on every image — delivering better consistency for complex products, jewelry, apparel, and catalog-scale ecommerce teams.',
    tableRows: [
      { feature: 'Editing method', reframe: '100% manual Pen Tool', competitor: 'Automated AI-first', reframeWins: true },
      { feature: 'Complex product handling', reframe: 'Hair, jewelry, apparel, glass', competitor: 'Standard product shapes', reframeWins: true },
      { feature: 'QA review', reframe: 'Dual-stage manual checklist', competitor: 'Automated QC', reframeWins: true },
      { feature: 'Free sample edits', reframe: '3 images edited free', competitor: 'Not typically offered', reframeWins: true },
      { feature: 'Turnaround', reframe: '12h, 24h, 48h, 72h', competitor: 'Varies', reframeWins: null },
      { feature: 'Ghost mannequin', reframe: 'Full specialist service', competitor: 'Not primary offering', reframeWins: true },
      { feature: 'Jewelry retouching', reframe: 'Specialist service', competitor: 'Basic cutout only', reframeWins: true },
      { feature: 'Revision policy', reframe: 'Unlimited revisions', competitor: 'Platform-based', reframeWins: true },
    ],
    reasons: [
      { heading: 'Manual Pen Tool beats AI for complex products.', body: 'AI cutouts struggle with fine-edge jewelry, apparel with complex collars or patterns, glass, transparent materials, and subjects with hair or fur. Reframe Visuals uses 100% manual Pen Tool tracing — consistent catalog quality that automated tools cannot replicate.' },
      { heading: 'Specialist services for apparel and jewelry.', body: 'Beyond cutouts, Reframe Visuals offers ghost mannequin editing, garment retouching, jewelry image editing, model retouching, and shadow creation. One partner for the full catalog workflow — not just background removal.' },
      { heading: 'Dual-stage QA before every delivery.', body: 'A senior editor reviews every batch against a service-specific checklist before it reaches you. Edge quality, color accuracy, background consistency, and file formatting are all verified before delivery.' },
      { heading: 'Test with 3 free edits on your actual products.', body: 'Upload your most complex product images and test the quality before any paid order. See exactly how Reframe Visuals handles your specific product edge and detail requirements.' },
    ],
    faqs: [
      { q: 'Why is manual editing better for jewelry and apparel?', a: 'For jewelry, apparel, ghost mannequin, and complex products, manual Pen Tool editing consistently outperforms automated cutout tools. Fine details, transparent materials, and irregular edges require human judgment that AI cannot reliably replicate.' },
      { q: 'Is Reframe Visuals competitively priced for complex products?', a: 'Reframe Visuals starts from $0.39 per image for background removal and clipping path. For complex products requiring manual editing, pricing reflects the precision delivered. Free sample edits let you test before committing.' },
      { q: 'What happens if the result does not meet my brief?', a: 'Reframe Visuals includes unlimited revisions. If the delivery does not match your brief, the team reworks it at no extra cost. The dual-stage QA process means revision requests are rare for customers who provide clear style references upfront.' },
    ],
  },
};

const ComparisonPage = () => {
  const { pathname } = useLocation();
  const data = COMPARISONS[pathname];

  if (!data) return <div className="max-w-4xl mx-auto px-6 py-24">Page not found.</div>;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
      { '@type': 'ListItem', position: 2, name: 'Why Switch to Reframe Visuals', item: data.canonical },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{data.metaTitle}</title>
        <meta name="description" content={data.metaDescription} />
        <link rel="canonical" href={data.canonical} />
        <meta property="og:title" content={data.metaTitle} />
        <meta property="og:description" content={data.metaDescription} />
        <meta property="og:url" content={data.canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-black/30 mb-3">
          Why Switch to Reframe Visuals
        </p>
        <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-5">
          {data.h1}
        </h1>
        <p className="text-[16px] text-black/60 leading-relaxed max-w-2xl mb-10">{data.intro}</p>

        <div className="mb-12 rounded-2xl border border-black/8 bg-[var(--color-bg-secondary)] p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40 mb-3">Direct answer</p>
          <p className="text-[16px] leading-8 text-black/80">{data.directAnswer}</p>
        </div>

        <div className="mb-12">
          <h2 className="text-[22px] font-semibold tracking-tight mb-5">
            Reframe Visuals vs {data.competitorLabel}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-black/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-text-primary)] text-white">
                  <th className="text-left px-5 py-3.5 font-semibold text-[13px]">Feature</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[13px]">Reframe Visuals</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-[13px]">{data.competitorLabel}</th>
                </tr>
              </thead>
              <tbody>
                {data.tableRows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-black/[0.015]'}>
                    <td className="px-5 py-3 text-black/55 text-[13px] font-medium">{row.feature}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`flex items-center gap-1.5 text-[13px] font-medium ${
                          row.reframeWins === true ? 'text-[#16A34A]' : 'text-black/70'
                        }`}
                      >
                        {row.reframeWins === true && <Check size={13} className="shrink-0" />}
                        {row.reframe}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-black/45">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-[22px] font-semibold tracking-tight mb-5">
            Why brands switch to Reframe Visuals
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.reasons.map((reason) => (
              <div
                key={reason.heading}
                className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
              >
                <h3 className="text-[15px] font-semibold tracking-tight mb-2">{reason.heading}</h3>
                <p className="text-[13px] text-black/60 leading-relaxed">{reason.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-[22px] font-semibold tracking-tight mb-5">Common questions</h2>
          <div className="space-y-3">
            {data.faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-black/8 p-5">
                <h3 className="text-[15px] font-semibold mb-2">{faq.q}</h3>
                <p className="text-[13px] text-black/65 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h2 className="text-[20px] font-semibold tracking-tight mb-1.5">
              Test Reframe Visuals on your products.
            </h2>
            <p className="text-[14px] text-black/60">
              Upload 3 images. Review the quality. No payment required until you are ready to scale.
            </p>
          </div>
          <Link
            to="/free-trial"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-[15px] font-bold text-white hover:bg-black transition-colors"
          >
            Get 3 Free Sample Edits <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ComparisonPage;
