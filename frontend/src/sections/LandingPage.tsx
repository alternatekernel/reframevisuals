import { Suspense, lazy } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import ScrollReveal from '../components/common/ScrollReveal';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Hero from './Hero';
import TrialAuditCta from './TrialAuditCta';
import BeatPixelzBanner from './BeatPixelzBanner';
import ClientCategoryStrip from './ClientCategoryStrip';
import TargetAudienceProof from './TargetAudienceProof';
import ImageGridSection from './landing/ImageGridSection';
import InstantDropZone from './landing/InstantDropZone';
import { landingImages } from './landing/landingImages';
import { faqSchema, howToSchema, orgSchema, priceSchema, websiteSchema, softwareAppSchema } from './landing/landingSchemas';
import { tokens } from '../utils/theme';

// Top sections - Static imports for instant scroll height and no flashing
import Workflow from './Workflow';
import ReframeCSShowcase from './ReframeCSShowcase';
import Testimonials from './Testimonials';

// Lower sections - Keep lazy for background loading/performance
const CompetitorComparison = lazy(() => import('./pricing/CompetitorComparison'));
const Stats = lazy(() => import('./Stats'));
const Pricing = lazy(() => import('./Pricing'));
const BlogPreview = lazy(() => import('./BlogPreview'));
const Faq = lazy(() => import('./Faq'));
const Integrations = lazy(() => import('./Integrations'));

// Minimal fallback component for sections
const SectionFallback = () => <div className="h-80 bg-surface" />;


const LandingPage = () => {
  return (
    <div className="bg-surface pb-12 lg:pb-14">
      <Helmet>
        <title>Ecommerce Photo Editing from $0.39/Image | Reframe Visuals</title>
        <meta
          name="description" content="Outsourced ecommerce photo editing from $0.39/image. Manual Pen Tool clipping, ghost mannequin, and retouching with 12h turnaround. Try 3 images free."
        />
        <link rel="canonical" href="https://reframevisuals.com/" />
        <meta property="og:title" content="Ecommerce Photo Editing from $0.39/Image | Reframe Visuals" />
        <meta
          property="og:description" content="Outsourced ecommerce photo editing from $0.39/image. Manual Pen Tool clipping, ghost mannequin, and retouching with 12h turnaround. Try 3 images free."
        />
        <meta property="og:url" content="https://reframevisuals.com/" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ecommerce Photo Editing from $0.39/Image | Reframe Visuals" />
        <meta name="twitter:description" content="Manual Pen Tool clipping, ghost mannequin, retouching from $0.39/image. AI-ready workflow. Try 3 images free." />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(priceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
      </Helmet>
      <Hero />
      <ScrollReveal variant="fade" duration={0.7}><InstantDropZone /></ScrollReveal>
      <ScrollReveal variant="fade" duration={0.55} className="hidden sm:block"><BeatPixelzBanner /></ScrollReveal>
      <ScrollReveal variant="fade" duration={0.9}><ImageGridSection images={landingImages.slice(0, 6)} /></ScrollReveal>
      <ScrollReveal variant="fade" duration={0.7}><Testimonials /></ScrollReveal>

      <section className="relative z-20 max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-12 pt-10 pb-10 lg:pt-16 lg:pb-12">
        <div className="grid gap-5 lg:gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <ScrollReveal variant="fade-slide" y={30}>
          <div 
            className="flex flex-col justify-center rounded-2xl border border-black/10 bg-[var(--color-text-primary)] p-6 text-white shadow-[0_18px_48px_rgba(0,0,0,0.12)] sm:p-9 lg:p-12"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <meta itemProp="name" content="3 Free Sample Edits" />
            <meta itemProp="price" content="0" />
            <meta itemProp="priceCurrency" content="USD" />
            <h2 className="text-[32px] font-semibold tracking-[-0.04em] leading-[1.05] sm:text-[42px] lg:text-[50px]">
              Test the edit before your first paid order.
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/65">
              Send 3 images. Judge the quality. Pay only when you're ready to scale.
            </p>
            <div className="mt-8 lg:mt-8 flex flex-col gap-2 sm:flex-row">
              <Link to="/free-trial" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-[16px] font-bold text-[var(--color-text-primary)] transition-all duration-300 hover:bg-[var(--color-bg-secondary)] shadow-sm active:scale-95">
                Get 3 Free Sample Edits
              </Link>
              <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 text-[16px] font-bold text-white transition-all duration-300 hover:bg-white/10 active:scale-95">
                View Pricing
              </Link>
            </div>
          </div>
          </ScrollReveal>

          <div className="hidden sm:grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-12 lg:content-center">
            {[
              {
                title: 'Human Photoshop editors',
                body: 'Every image traced and reviewed by hand before it ships.',
                bg: 'bg-white',
                border: 'border-2 border-black/10 hover:border-black/20',
                icon: 'text-black/80',
              },
              {
                title: 'AI-assisted workflow',
                body: 'AI handles routine steps. Editors check and correct every image.',
                bg: 'bg-white',
                border: 'border-2 border-black/10 hover:border-black/20',
                icon: 'text-black/80',
              },
              {
                title: 'Built for ecommerce teams',
                body: 'Amazon, jewelry, apparel, agencies. Any ecommerce seller, any size.',
                bg: 'bg-white',
                border: 'border-2 border-black/10 hover:border-black/20',
                icon: 'text-black/80',
              },
              {
                title: 'Flexible turnaround',
                body: '12h, 24h, 48h, or 72h. Choose what fits your deadline.',
                bg: 'bg-white',
                border: 'border-2 border-black/10 hover:border-black/20',
                icon: 'text-black/80',
              },
            ].map(({ title, body, icon }, i) => (
              <ScrollReveal key={title} delay={i * 0.07}>
              <div className="flex gap-3 sm:gap-4 items-start py-2 sm:py-3">
                <CheckCircle2 size={20} className={`shrink-0 mt-0.5 sm:mt-1 sm:size-6 ${icon}`} />
                <div className="flex flex-col min-w-0">
                  <h3 className="text-[16px] sm:text-[19px] lg:text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-snug">{title}</h3>
                  <p className="mt-1 sm:mt-2 text-[13.5px] sm:text-[15px] lg:text-[17px] leading-relaxed text-black/55">{body}</p>
                </div>
              </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <ScrollReveal variant="fade-slide" y={50} threshold={0.04}><Workflow /></ScrollReveal>

      <ScrollReveal variant="fade-slide" y={30}><TargetAudienceProof /></ScrollReveal>
      <ScrollReveal variant="fade" delay={0.05} duration={0.6}><ClientCategoryStrip /></ScrollReveal>

      <ScrollReveal variant="spring-scale"><TrialAuditCta /></ScrollReveal>
      {/* <AIProductShowcase /> */}

      <ScrollReveal variant="fade-slide" y={20}>
      <section className="max-w-5xl mx-auto px-6 lg:px-10 pt-4 pb-4 lg:pt-6 lg:pb-6 overflow-visible">
        <div className="grid gap-3 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center overflow-visible">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-text-primary)] text-white">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-[20px]">Two editors review every image before delivery.</h2>
            <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-black/60">
              We check each file against service-specific criteria before delivery. Your catalog stays consistent across thousands of images.
            </p>
          </div>
          <Link
            to="/quality-assurance-process"
            className="group inline-flex items-center justify-center gap-1.5 text-[16px] font-bold text-[var(--color-text-primary)] transition-all"
          >
            <span className="relative">
              View our QA Process
              <span className={tokens.interactiveUnderline} />
            </span>
            <ArrowRight size={14} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/70 shrink-0" />
          </Link>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-slide" y={40} className="hidden sm:block"><ReframeCSShowcase /></ScrollReveal>

      <Suspense fallback={<SectionFallback />}>
        <ScrollReveal variant="fade-slide" y={40}><CompetitorComparison /></ScrollReveal>
        <ScrollReveal variant="spring-scale"><Stats /></ScrollReveal>
        <ScrollReveal variant="fade-slide" y={30} className="hidden sm:block"><BlogPreview /></ScrollReveal>
        <ScrollReveal variant="spring-scale"><Pricing /></ScrollReveal>
        <ScrollReveal variant="fade-slide" y={30}><Integrations /></ScrollReveal>
        <ScrollReveal variant="fade"><Faq /></ScrollReveal>
      </Suspense>

      <ScrollReveal variant="fade-slide" y={25}>
      <section className="max-w-5xl mx-auto px-6 lg:px-10 pt-6 lg:pt-8">
        <div className="relative overflow-hidden rounded-2xl border border-black/10 animate-card-bg p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-black/5 blur-2xl hidden sm:block" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-black/5 blur-2xl hidden sm:block" />
          <div className="relative z-10 grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
            <div>
              <h2 className="text-[22px] lg:text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-[1.15]">
                About Reframe Visuals
              </h2>
              <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-black/65">
                Reframe Visuals edits product photos for Amazon sellers, apparel brands, jewelry stores, and agencies.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <Link
                to="/about"
                className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] font-medium text-black shadow-sm transition-all duration-300 hover:border-black/20 hover:bg-black/[0.02] active:scale-95"
              >
                <span>About Reframe Visuals</span>
                <ArrowRight size={14} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/75" />
              </Link>
              <Link
                to="/reframe-visuals-services"
                className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] font-medium text-black shadow-sm transition-all duration-300 hover:border-black/20 hover:bg-black/[0.02] active:scale-95"
              >
                <span>Reframe Visuals Services</span>
                <ArrowRight size={14} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/75" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>
    </div>
  );
};

export default LandingPage;
