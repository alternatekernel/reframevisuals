import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { cx, layout, typography } from '../utils/theme';
import { useContent } from '../context/ContentBase';
import Workflow from '../sections/Workflow';
import Integrations from '../sections/Integrations';
import ServicesCTA from '../sections/services/ServicesCTA';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Search, Wand2, ShieldCheck } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Upload & Connect',
    description: 'We integrate securely into your existing pipeline. Drop files manually or connect your Google Drive, Dropbox, or Amazon Seller Central. Our systems fetch the raw assets instantly.',
    icon: Search
  },
  {
    number: '02',
    title: 'Scoping & Estimation',
    description: 'Within 15-30 minutes, our admins review your files to gauge complexity. We provide a guaranteed, transparent quote before you ever commit to a job. No hidden fees or surprise overages.',
    icon: Clock
  },
  {
    number: '03',
    title: 'Human + AI Retouching',
    description: 'Human editors retouch each image using manual tools. AI handles routine steps; editors check and refine every shadow, texture, and clipping path.',
    icon: Wand2
  },
  {
    number: '04',
    title: 'Quality Control & Delivery',
    description: 'Two editors review each file before delivery. Then you get the images in your dashboard to approve or request revisions.',
    icon: ShieldCheck
  }
];

const HowItWorksPage: React.FC = () => {
  const { isUserAuthenticated } = useContent();

  return (
    <div className="min-h-screen bg-white text-[var(--color-text-primary)] pt-16">
      <Helmet>
        <title>How Reframe Visuals Works | Enterprise Photo Editing Workflow</title>
        <meta
          name="description"
          content="Step-by-step: how we handle your images from upload to delivery, including editing, QA review, and revisions."
        />
        <link rel="canonical" href="https://reframevisuals.com/how-it-works" />
        <meta property="og:title" content="How Reframe Visuals Works | Photo Editing Workflow" />
        <meta property="og:description" content="Upload, brief, QA review, delivery — how we handle your images from raw files to catalog-ready outputs in 12–72 hours." />
        <meta property="og:url" content="https://reframevisuals.com/how-it-works" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative pt-[120px] pb-16 lg:pt-[180px] lg:pb-24 overflow-hidden">
        <div className={cx(layout.compactShell, 'relative z-10 px-5 sm:px-6 lg:px-10')}>
          <div className="max-w-[800px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[44px] sm:text-[56px] lg:text-[72px] font-semibold tracking-[-0.04em] leading-[1.05] text-[var(--color-text-primary)] mb-6">
                How Reframe <span className="text-black/40">Visuals Works.</span>
              </h1>
              <p className="text-[18px] sm:text-[20px] lg:text-[22px] leading-[1.5] text-[var(--color-text-secondary)] font-medium max-w-[640px] mx-auto">
                Upload your images, we edit and QA each one, you approve and download.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workflow Diagram Embed */}
      <div className="relative z-20 pb-20 -mt-10 lg:-mt-0">
        <Workflow />
      </div>

      {/* Step Breakdown */}
      <section className="py-20 lg:py-32 bg-[#F8F9FA]">
        <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
          <div className="max-w-[800px] mx-auto mb-16 lg:mb-24 text-center">
            <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-semibold tracking-[-0.04em] leading-[1.05] text-[var(--color-text-primary)]">
              How each order works.
            </h2>
          </div>

          <div className="grid gap-12 lg:gap-20">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
                  className="relative flex flex-col md:flex-row gap-8 lg:gap-16 items-start"
                >
                  <div className="md:w-1/3 flex flex-col gap-4">
                    <span className="text-[64px] lg:text-[84px] font-bold text-black/5 leading-none tracking-tighter">
                      {step.number}
                    </span>
                    <h3 className="text-[24px] lg:text-[28px] font-bold text-[var(--color-text-primary)] tracking-[-0.02em] leading-[1.2]">
                      {step.title}
                    </h3>
                  </div>
                  
                  <div className="md:w-2/3 md:pt-[20px]">
                    <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-[0_16px_60px_-15px_rgba(0,0,0,0.05)] border border-black/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
                      <Icon size={32} className="text-brand mb-6" strokeWidth={1.5} />
                      <p className="text-[18px] lg:text-[20px] leading-[1.6] text-black/70 font-medium">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <Integrations />

      {/* Dashboard Callout */}
      <section className="py-20 lg:py-32 bg-white">
        <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
           <div className="bg-[#171717] rounded-[32px] lg:rounded-[48px] p-8 sm:p-12 lg:p-20 relative overflow-hidden">
             {/* Glows */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none opacity-30" />

             <motion.div
               initial={{ opacity: 0, y: 24 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: '-100px' }}
               transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
               className="relative z-10"
             >
               <div className="max-w-[640px] mb-10">
                 <h2 className="text-[32px] sm:text-[42px] lg:text-[52px] font-semibold tracking-[-0.04em] leading-[1.05] text-white mb-4">
                   Your production portal — included free.
                 </h2>
                 <p className="text-[18px] text-white/55 leading-relaxed">
                   Every order comes with access to the Reframe Visuals customer portal. Track production live, review delivered assets, request revisions, and download finished files — all without leaving your browser.
                 </p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                 {[
                   { title: 'Real-time order tracking', body: 'Status updates the moment an editor moves your order — powered by live Server-Sent Events, no refresh needed.' },
                   { title: 'In-portal image review', body: 'Every delivered image appears in your portal at full resolution for inspection before you approve.' },
                   { title: 'Revision requests', body: 'Submit revision notes directly from the portal. The order returns to production automatically at no extra cost.' },
                   { title: 'Pricing proposal approval', body: 'Receive a transparent per-image quote before production starts. Approve or decline before a single pixel is edited.' },
                   { title: 'ZIP download on approval', body: 'One click downloads all finished assets as a ZIP. No file-sharing links, no FTP, no expiry.' },
                   { title: 'Email notification control', body: 'Choose which events email you: proposal ready, assets delivered, order finalized, revision processed.' },
                 ].map(({ title, body }) => (
                   <div key={title} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
                     <div className="text-[14px] font-semibold text-white mb-1.5">{title}</div>
                     <div className="text-[13px] text-white/45 leading-relaxed">{body}</div>
                   </div>
                 ))}
               </div>

               <div className="flex flex-wrap gap-3">
                 <Link
                   to="/platform"
                   className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-bold text-[15px] hover:scale-105 transition-transform"
                 >
                   See all platform features
                   <ArrowRight size={16} />
                 </Link>
                 <Link
                   to="/dashboard"
                   className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3.5 rounded-full font-semibold text-[15px] hover:bg-white/[0.06] transition-colors"
                 >
                   Open dashboard
                 </Link>
               </div>
             </motion.div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <ServicesCTA isUserAuthenticated={isUserAuthenticated} />
    </div>
  );
};

export default HowItWorksPage;
