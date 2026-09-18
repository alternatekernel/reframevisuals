import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Box, ChevronDown, Clapperboard, Layers3, Megaphone, PackageCheck, ScanSearch, ShieldCheck, Shirt, Sparkles, Upload, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Workflow from '../sections/Workflow';
import { absoluteCanonicalUrl } from '../utils/seo';
import { cx, layout, tokens, typography } from '../utils/theme';

const asset = (name: string) => `https://res.cloudinary.com/dnmj4altq/image/upload/reframeimages/ai-product-visuals/${name}`;

const outputs = [
  { title: 'PDP product images', copy: 'Clean packshots, marketplace crops, white backgrounds, and store-ready product detail page visuals.', icon: PackageCheck },
  { title: 'Lifestyle scenes', copy: 'Place products into styled rooms, outdoor setups, seasonal campaigns, and brand-matched environments.', icon: Layers3 },
  { title: 'Fashion photoshoots', copy: 'Create model-led apparel looks, pose variations, street-style frames, and campaign directions from product assets.', icon: Shirt },
  { title: 'UGC-style creatives', copy: 'Produce social-first product visuals for stories, paid social, launch drops, and creator-style ads.', icon: Megaphone },
  { title: 'Short product videos', copy: 'Turn approved visual directions into short clips for Reels, TikTok, ads, and product launches.', icon: Clapperboard },
  { title: 'Catalog reshoots', copy: 'Rebuild consistent visual systems for SKU families without waiting on another physical shoot.', icon: Box },
];

const quality = ['Product shape and detail checks', 'Clean edges, crops, and marketplace framing', 'Brand-safe color, lighting, and style', 'Human-reviewed output before delivery', 'Asset ownership for approved files', 'Batch consistency across SKU families'];

const workflowNodes = [
  { id: 'upload', label: 'Upload', sublabel: 'Product Shots', icons: [Upload], color: '#171717', bg: '#FFFFFF', iconColor: '#171717' },
  { id: 'direction', label: 'Direction', sublabel: 'Visual Brief', icons: [ScanSearch], color: '#171717', bg: '#FFFFFF', iconColor: '#171717' },
  { id: 'generate', label: 'Generate', sublabel: 'Visual Set', icons: [Wand2], color: '#171717', bg: '#FFFFFF', iconColor: '#171717' },
  { id: 'review', label: 'Review', sublabel: 'Ready Assets', icons: [ShieldCheck], color: '#171717', bg: '#FFFFFF', iconColor: '#171717' },
];

const workflowDescriptions = [
  'Send existing product photos, catalog references, or campaign source images.',
  'Choose PDP, lifestyle, ad, social, marketplace, or batch catalog direction.',
  'AI-assisted production creates a focused visual set from your product source.',
  'Reframe reviews realism, shape accuracy, crop, and commercial usability before delivery.',
];

const faq = [
  ['Do I need studio product photos first?', 'Clear source images create the best result, but basic catalog shots can work when the product shape and details are visible.'],
  ['Can you create lifestyle scenes from plain product images?', 'Yes. The page is designed for PDP, lifestyle, campaign, and social output from existing product images.'],
  ['Is this fully self-serve AI?', 'No. This is positioned as AI-assisted Reframe production with human review for commercial usability.'],
  ['Can this support batches?', 'Yes. Catalog batches, campaign sets, and SKU families are part of the intended workflow.'],
  ['Can you make short product videos too?', 'Yes. Reframe can create short product-led clips for ads, Reels, TikTok, launches, and storefront motion assets when the brief needs video output.'],
  ['Will the output match our brand look?', 'That is the goal. We use your existing catalog, references, color direction, and campaign notes to keep the visual set aligned before human review.'],
  ['Do we own the assets?', 'Approved final assets are delivered for your commercial use across product pages, ads, social, email, and marketplace channels.'],
];

const AIProductVisualsPage = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const canonicalUrl = absoluteCanonicalUrl('/ai-product-visuals');

  useEffect(() => {
    let canonicalSeen = false;
    document.querySelectorAll('link[rel="canonical"]').forEach((node) => {
      const link = node as HTMLLinkElement;
      if (link.href !== canonicalUrl || canonicalSeen) {
        link.remove();
        return;
      }
      canonicalSeen = true;
    });
    document.querySelectorAll('meta[name="description"]').forEach((node) => {
      if ((node as HTMLMetaElement).content !== 'Generate PDP images, fashion photoshoots, lifestyle scenes, UGC-style ads, product videos, and catalog visuals from existing product assets with human-reviewed AI production.') node.remove();
    });
  }, [canonicalUrl]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };

  return (
    <div className="bg-surface overflow-x-hidden text-[var(--color-text-primary)]">
      <Helmet>
        <title>AI Product Visuals for E-commerce | Reframe Visuals</title>
        <meta name="description" content="Generate PDP images, fashion photoshoots, lifestyle scenes, UGC-style ads, product videos, and catalog visuals from existing product assets with human-reviewed AI production." />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className={cx('relative overflow-hidden min-h-[calc(100vh-64px)] py-16 bg-white', layout.sectionGutter)}>
        <div className="absolute top-1/4 left-0 -translate-y-1/2 opacity-[0.02] pointer-events-none">
          <img src="/logo.svg" alt="Reframe AI Background Graphic" className="w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] -translate-x-1/2" />
        </div>
        <div className={cx(layout.compactShell, 'relative z-10') }>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className={cx(typography.vercelSection, 'text-[var(--color-text-primary)] mb-8')}>
              Your catalog,<br />
              <span className="text-black/40">instantly re-shot.</span>
            </h1>
            <p className="text-[18px] text-[#4d4d4d] leading-relaxed max-w-2xl mx-auto font-normal">
              Upload product photos, catalog references, or a store link. Reframe creates PDP images, fashion shots, lifestyle scenes, UGC-style creatives, short videos, and marketplace-ready assets that are AI-assisted, brand-directed, and human-reviewed.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/free-trial" className={cx(tokens.radiusBtn, tokens.primaryCTA, 'inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[15px] font-bold tracking-wide shadow-sm active:scale-95')}>Start a project <ArrowRight size={16} /></Link>
              <Link to="/services" className={cx(tokens.radiusBtn, tokens.secondaryCTA, 'inline-flex min-h-12 items-center justify-center gap-2 border border-black/10 px-5 text-[15px] font-bold tracking-wide shadow-sm active:scale-95')}>View services</Link>
            </div>
          </motion.div>

          <div className="relative mx-auto mt-8 lg:mt-10 grid max-w-5xl grid-cols-1 items-center gap-6 px-5 lg:grid-cols-[1fr_auto_1.2fr]">
            <motion.div initial={{opacity:0, x:-20}} whileInView={{opacity:1, x:0}} viewport={{once:true}} className="space-y-4">
              <div className={cx(tokens.surfaceCard, 'overflow-hidden p-4')}>
                 <img src={asset('catalog-set.svg')} alt="Raw ecommerce product catalog photos before AI-assisted editing by Reframe Visuals" className="aspect-square w-full bg-[#F3F4F6] object-cover rounded-xl" />
                 <div className="mt-3 flex items-center gap-2 px-2 pb-1">
                   <div className="h-2 w-2 rounded-full bg-black/20"></div>
                   <span className="text-[12px] font-bold uppercase tracking-widest text-black/45">Raw input</span>
                 </div>
              </div>
            </motion.div>

            <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="flex justify-center lg:rotate-0 rotate-90 py-4 lg:py-0">
               <div className="flex flex-col items-center gap-3">
                 <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
                   <Wand2 size={24} className="text-black/70" />
                 </div>
                 <ArrowRight size={24} className="text-black/20" />
               </div>
            </motion.div>

            <motion.div initial={{opacity:0, x:20}} whileInView={{opacity:1, x:0}} viewport={{once:true}} className="space-y-4 lg:rotate-2">
               <div className={cx(tokens.surfacePanel, 'overflow-hidden p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]')}>
                  <img src={asset('hero-product-set.svg')} alt="AI-generated ecommerce campaign visuals - professional product images from Reframe Visuals AI workflow" className="aspect-[4/3] w-full bg-[#F3F4F6] object-cover rounded-2xl" />
                 <div className="mt-4 flex items-center justify-between px-2 pb-1">
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#16A34A]"></div>
                      <span className="text-[12px] font-bold uppercase tracking-widest text-black/80">Campaign output</span>
                    </div>
                    <span className="text-[11px] font-heading font-black uppercase tracking-[0.16em] text-[#7C3AED]">Reframe AI</span>
                 </div>
               </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-20 lg:mt-24 max-w-xl mx-auto px-5"
          >
            <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-black/20 bg-[#FAFAFA] py-10 transition-all duration-300 hover:border-black/30 hover:bg-white hover:shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                <Upload size={20} className="text-black/60 group-hover:text-[#7C3AED]" />
              </div>
              <p className="mt-4 font-heading text-[16px] font-bold text-black/80">Upload or drop your assets</p>
              <p className="mt-1 text-[13px] text-black/45">Supports JPG, PNG, WEBP, or an ecommerce store link.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className={cx('border-y border-black/[0.06] bg-white py-8', layout.sectionGutter)}>
        <div className={cx(layout.compactShell, 'flex flex-wrap items-center justify-center gap-3 text-[11px] font-heading font-black uppercase tracking-[0.16em]')}>
          {['PDP images', 'Fashion shots', 'Lifestyle scenes', 'UGC visuals', 'Product videos', 'Ads', 'Stories', 'Marketplace assets'].map((item, i) => {
            return <span key={item} className={cx("px-3 py-1.5 rounded-full border border-black/10 bg-white text-black/70 shadow-sm")}>{item}</span>;
          })}
        </div>
      </section>

      <section className={cx('pt-14 pb-10 sm:pt-16 sm:pb-12 lg:pt-24 lg:pb-16 bg-white', layout.sectionGutter)}>
        <div className={cx(layout.compactShell, 'grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end')}>
          <div>
            <p className={cx(typography.label, 'mb-4 text-black/35')}>What you can create</p>
            <h2 className="font-heading text-[38px] sm:text-[56px] font-semibold tracking-[-0.055em] leading-[1.02]">One product asset. <span className="text-black/30">Every channel covered.</span></h2>
          </div>
          <p className="max-w-xl text-[16px] leading-relaxed text-black/55 lg:justify-self-end">Build visual mileage from existing assets: clean packshots, styled scenes, apparel model looks, UGC-style social, ad crops, short product videos, and consistent catalog presentation.</p>
        </div>
        <div className={cx(layout.compactShell, 'mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3')}>
          {outputs.map(({ title, copy, icon: Icon }, i) => {
            return (
              <article key={title} className="rounded-[20px] border border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.06)] shadow-sm">
                <Icon size={24} className="mb-8 text-black/70" strokeWidth={1.5} />
                <h3 className="text-[18px] font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-primary)]/60">{copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={cx('pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-16 bg-[#FAFAFA]', layout.sectionGutter)}>
        <div className={cx(layout.compactShell, 'grid gap-5 lg:grid-cols-2')}>
          <ShowcaseCard title="Catalog source" img="catalog-set.svg" copy="Start from clear product images, SKU references, store links, existing catalog shots, or campaign references." />
          <ShowcaseCard title="Commercial output set" img="hero-product-set.svg" copy="Create PDP, fashion, lifestyle, UGC-style, ad, marketplace, and short-video visual variants." />
        </div>
      </section>

      <Workflow
        eyebrow="AI visual workflow"
        title={<>From product shot <span className="text-black/30">to selling set.</span></>}
        description="A focused production flow for turning product sources and brand direction into commercial-ready visuals across images, social creatives, catalog batches, and video clips."
        nodes={workflowNodes}
        stepDescriptions={workflowDescriptions}
        integrations={['PDP', 'Fashion', 'Lifestyle', 'UGC', 'Ads', 'Video', 'Marketplace', 'Catalog batch']}
        inputActors={['Product shots', 'Store links', 'Catalog refs', 'Brand notes']}
        outputActors={['PDP assets', 'Fashion shots', 'Ad crops', 'Video clips', 'Social set']}
        deliveryLabel="Delivered as ready product visual assets"
      />

      <section className={cx('pt-10 pb-12 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-20 bg-white', layout.sectionGutter)}>
        <div className={cx(layout.compactShell, 'grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center')}>
          <div>
            <p className={cx(typography.label, 'mb-4 text-black/35')}>Quality guardrails</p>
            <h2 className="font-heading text-[38px] sm:text-[56px] font-semibold tracking-[-0.055em] leading-[1.02]">AI speed with <span className="text-black/30">production judgment.</span></h2>
            <p className="mt-5 text-[16px] leading-relaxed text-black/55">The value is not just generating more files. Reframe reviews outputs for realism, product shape, materials, brand consistency, crop, channel fit, and commercial usability before delivery.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quality.map((item, i) => {
              return (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4 text-[14px] font-bold transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.06)]">
                  <BadgeCheck size={18} className="text-black/70" />
                  <span className="text-[var(--color-text-primary)]">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={cx('pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24 bg-[#111] text-white', layout.sectionGutter)}>
        <div className={cx(layout.contentShell, 'text-center')}>
          <h2 className="font-heading text-[40px] sm:text-[64px] font-semibold tracking-[-0.06em] leading-[0.98]">Give every product more ways to sell.</h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/60">Send product images, references, or a store link and receive polished visuals for PDPs, campaigns, marketplaces, social content, and short-form product video.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/free-trial" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[15px] font-bold tracking-wide text-black shadow-sm active:scale-95">Start a project <ArrowRight size={16} /></Link>
            <Link to="/book-meeting" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-[15px] font-bold tracking-wide text-white shadow-sm active:scale-95">Book a review</Link>
          </div>
        </div>
      </section>

      <section className={cx('pt-12 pb-14 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-24 bg-white', layout.sectionGutter)}>
        <div className={layout.contentShell}>
          <p className={cx(typography.label, 'mb-5 text-black/35')}>FAQ</p>
          <div className="grid gap-3">
            {faq.map(([q, a], i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.035, duration: 0.25 }}
                className={cx(
                  'group overflow-hidden rounded-2xl border transition-all duration-300',
                  activeFaq === i ? 'border-black/15 bg-white' : 'border-black/[0.07] bg-[#FAFAFA] hover:border-black/15'
                )}
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
                >
                  <span className="font-heading text-[15px] font-bold leading-snug tracking-[-0.015em] text-black lg:text-[16px]">
                    {q}
                  </span>

                  <motion.span
                    className={cx(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all',
                      activeFaq === i ? 'bg-black text-white' : 'bg-[#F1F5F9] text-black/50 group-hover:bg-[#E2E8F0]'
                    )}
                    animate={{ rotate: activeFaq === i ? 180 : 0 }}
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                    >
                      <div className="border-t border-black/8 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                        <p className="text-[14px] font-medium leading-relaxed text-black/65 lg:text-[15px]">{a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const VisualCard = ({ label, img }: { label: string; img: string }) => (
  <div className={cx(tokens.surfaceCard, 'overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.06)]')}>
    <img src={asset(img)} alt={label} className="aspect-square w-full bg-[#F3F4F6] object-cover" />
    <div className="flex items-center justify-between px-2 py-3 text-[11px] font-heading font-black uppercase tracking-[0.16em] text-black/45"><span>{label}</span><span>Reframe</span></div>
  </div>
);

const MiniProof = ({ label }: { label: string }) => (
  <div className="border border-black/10 bg-white px-5 py-4 text-center text-[11px] font-heading font-black uppercase tracking-[0.16em] text-black/45 shadow-sm">{label}</div>
);

const ShowcaseCard = ({ title, img, copy }: { title: string; img: string; copy: string }) => (
  <article className={cx(tokens.surfacePanel, 'overflow-hidden bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.06)]')}>
    <img src={asset(img)} alt={title} className="aspect-[4/3] w-full bg-[#F3F4F6] object-cover" />
    <div className="p-3 sm:p-5">
      <h3 className="text-[22px] font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-black/55">{copy}</p>
    </div>
  </article>
);

export default AIProductVisualsPage;
