import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cx, layout } from '../utils/theme';
import {
  Zap, PackageCheck, RotateCcw, Download, Bell, MessageSquare,
  BarChart2, ShieldCheck, Clock, ArrowRight, CheckCircle2
} from 'lucide-react';

const platformSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Reframe Visuals Customer Portal',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://reframevisuals.com/dashboard',
  description:
    'Proprietary SaaS customer portal for managing photo editing orders end-to-end. Real-time order tracking, in-portal image review, revision requests, proposal approval, ZIP downloads, and direct editor messaging.',
  featureList: [
    'Real-time order status updates via Server-Sent Events',
    'Order tracking from submission to delivery',
    'In-portal image review and approval',
    'Revision requests with notes',
    'Pricing proposal review and approval',
    'Order cancellation for pending orders',
    'ZIP download of completed asset batches',
    'Order history and billing dashboard',
    'Email notification preferences',
    'Brand guidelines and order templates',
    'Direct messaging with the editing team',
    '3-step guided onboarding for new customers',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Included free with every order. No subscription required.',
  },
  provider: {
    '@type': 'Organization',
    name: 'Reframe Visuals',
    url: 'https://reframevisuals.com',
  },
};

const features = [
  {
    icon: Zap,
    title: 'Real-Time Order Tracking',
    description:
      'Your order status updates the moment an editor moves it — no email, no manual refresh. The portal uses Server-Sent Events (SSE) to push live status changes directly to your browser.',
    detail: 'Submitted → Pending Approval → In Progress → In Review → Complete',
  },
  {
    icon: PackageCheck,
    title: 'In-Portal Image Review & Approval',
    description:
      'Every delivered image appears in your portal for inspection before you approve. View each asset at full resolution, compare before and after, then approve the batch or request changes.',
    detail: 'One-click approval or per-image revision notes',
  },
  {
    icon: RotateCcw,
    title: 'Revision Requests',
    description:
      'If anything needs adjusting, submit revision notes directly from the portal. The order returns to our editors automatically. Revisions are included within the delivery window at no extra charge.',
    detail: 'Revision notes → back to production → re-delivered to your portal',
  },
  {
    icon: Download,
    title: 'ZIP Download on Approval',
    description:
      'Approve your delivery and download all finished assets as a single ZIP file in seconds. No file-sharing links, no expiring URLs, no FTP required.',
    detail: 'Full-resolution files, your specified output format and dimensions',
  },
  {
    icon: BarChart2,
    title: 'Order History & Progress Tracking',
    description:
      'Every order you have ever placed is visible in your dashboard — with status, production progress percentage, delivery date, and invoice history all in one place.',
    detail: 'Full order timeline from first upload to completed delivery',
  },
  {
    icon: Bell,
    title: 'Configurable Email Notifications',
    description:
      'Choose exactly which events trigger an email to your inbox: pricing proposal ready, assets delivered, order finalized, or revision processed. Toggle each on or off from your account settings.',
    detail: 'Per-event email toggles in Account → Notifications',
  },
  {
    icon: MessageSquare,
    title: 'Direct Messaging with Editors',
    description:
      'Chat with the Reframe Visuals team directly from your portal. Ask questions about an order, share reference images, or escalate to a human agent — all without leaving the platform.',
    detail: 'In-portal chat with support escalation',
  },
  {
    icon: ShieldCheck,
    title: 'Pricing Proposal Approval',
    description:
      'Before a single pixel is edited, you receive a transparent price quote in your portal. Review the scope, per-image rate, and total cost, then approve or decline — no surprise charges.',
    detail: 'Quote → your approval → production starts',
  },
  {
    icon: Clock,
    title: 'Order Templates & Brand Guidelines',
    description:
      'Save your output specifications — format, size, background, services — as a reusable template. Store brand guidelines once so every order uses your exact standards automatically.',
    detail: 'Templates saved to your account, reusable across all orders',
  },
];

const PlatformPage = () => (
  <div className="min-h-screen bg-white text-[var(--color-text-primary)] pt-16">
    <Helmet>
      <title>Customer Portal & Platform Features | Reframe Visuals</title>
      <meta
        name="description"
        content="The Reframe Visuals customer portal gives you real-time order tracking, in-portal image review, revision requests, ZIP downloads, and direct editor messaging — all free with every order."
      />
      <link rel="canonical" href="https://reframevisuals.com/platform" />
      <script type="application/ld+json">{JSON.stringify(platformSchema)}</script>
    </Helmet>

    {/* Hero */}
    <section className="relative pt-[120px] pb-16 lg:pt-[180px] lg:pb-24 overflow-hidden">
      <div className={cx(layout.compactShell, 'relative z-10 px-5 sm:px-6 lg:px-10')}>
        <div className="max-w-[800px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-black/[0.04] border border-black/[0.08] rounded-full px-4 py-1.5 text-[13px] font-medium text-black/60 mb-6">
              Included free with every order
            </div>
            <h1 className="text-[44px] sm:text-[56px] lg:text-[72px] font-semibold tracking-[-0.04em] leading-[1.05] text-[var(--color-text-primary)] mb-6">
              A production portal,{' '}
              <span className="text-black/40">not just an inbox.</span>
            </h1>
            <p className="text-[18px] sm:text-[20px] lg:text-[22px] leading-[1.5] text-[var(--color-text-secondary)] font-medium max-w-[640px] mx-auto mb-10">
              Track every order in real time, review delivered assets, request revisions, and download finished files — all from your Reframe Visuals dashboard. No email chains. No FTP. No waiting for status updates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/free-trial"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-bold text-[15px] hover:scale-105 transition-transform"
              >
                Try free — 3 images edited
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 border border-black/10 bg-white text-black px-6 py-3.5 rounded-full font-semibold text-[15px] hover:bg-black/[0.03] transition-colors"
              >
                Open dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Platform snapshot stats */}
    <section className="py-12 border-y border-black/[0.06] bg-[#FAFAFA]">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 'Live', label: 'Order status via SSE' },
            { value: '0', label: 'Extra cost for revisions' },
            { value: '1-click', label: 'ZIP download on approval' },
            { value: 'Free', label: 'Portal with every order' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-[36px] sm:text-[42px] font-bold tracking-[-0.04em] text-black">{value}</div>
              <div className="text-[13px] text-black/50 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Feature grid */}
    <section className="py-20 lg:py-32">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="max-w-[700px] mx-auto text-center mb-16 lg:mb-24">
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-semibold tracking-[-0.04em] leading-[1.05] mb-4">
            Everything in the portal.
          </h2>
          <p className="text-[18px] text-black/55 leading-relaxed">
            Nine platform features — all included free, no subscription required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: (idx % 3) * 0.08 }}
                className="bg-white border border-black/[0.07] rounded-2xl p-7 flex flex-col gap-4 hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.10)] transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                  <Icon size={18} className="text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-black tracking-[-0.02em] mb-2">{f.title}</h3>
                  <p className="text-[14px] text-black/55 leading-relaxed">{f.description}</p>
                </div>
                <div className="mt-auto pt-3 border-t border-black/[0.06]">
                  <span className="text-[12px] font-medium text-black/40">{f.detail}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* How the workflow connects */}
    <section className="py-20 lg:py-32 bg-[#F8F9FA]">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="max-w-[700px] mx-auto text-center mb-16">
          <h2 className="text-[32px] sm:text-[42px] font-semibold tracking-[-0.04em] leading-[1.05] mb-4">
            From upload to download in 5 steps.
          </h2>
        </div>
        <div className="max-w-[680px] mx-auto space-y-4">
          {[
            { step: '01', title: 'Place your order', body: 'Select services, upload images, and set output specs (format, size, background) directly in the portal.' },
            { step: '02', title: 'Receive a transparent quote', body: 'Within 15–30 minutes you get a per-image price quote to review and approve before production starts.' },
            { step: '03', title: 'Track production live', body: 'Watch your order move through production in real time. Status changes appear in your portal the instant they happen.' },
            { step: '04', title: 'Review delivered assets', body: 'Inspect every edited image at full resolution. Submit revision notes if anything needs adjusting — included at no extra cost.' },
            { step: '05', title: 'Approve and download', body: 'One click approves the delivery. Download all finished files as a ZIP instantly.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-5 items-start bg-white rounded-2xl border border-black/[0.07] p-6">
              <span className="text-[28px] font-bold text-black/10 leading-none tracking-tighter shrink-0 mt-0.5">{step}</span>
              <div>
                <div className="text-[16px] font-semibold text-black mb-1">{title}</div>
                <div className="text-[14px] text-black/55 leading-relaxed">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* vs competitors */}
    <section className="py-20 lg:py-32">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="max-w-[700px] mx-auto text-center mb-12">
          <h2 className="text-[32px] sm:text-[42px] font-semibold tracking-[-0.04em] leading-[1.05] mb-4">
            How we compare on platform features.
          </h2>
        </div>
        <div className="max-w-[720px] mx-auto overflow-x-auto">
          <table className="w-full text-[14px] border-collapse">
            <thead>
              <tr className="border-b border-black/[0.08]">
                <th className="text-left py-3 pr-6 font-semibold text-black/50 w-1/2">Feature</th>
                <th className="py-3 px-4 font-bold text-black text-center">Reframe Visuals</th>
                <th className="py-3 px-4 font-semibold text-black/40 text-center">Typical competitor</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Real-time order tracking', true, false],
                ['In-portal image review', true, false],
                ['Revision requests from portal', true, false],
                ['Pricing quote before production', true, false],
                ['ZIP download on approval', true, false],
                ['Email notification preferences', true, false],
                ['No minimum order', true, false],
                ['Free trial (3 images)', true, false],
                ['No subscription required', true, false],
              ].map(([label, ours, theirs]) => (
                <tr key={label as string} className="border-b border-black/[0.05]">
                  <td className="py-3 pr-6 text-black/70">{label as string}</td>
                  <td className="py-3 px-4 text-center">
                    {ours ? <CheckCircle2 size={18} className="text-black mx-auto" strokeWidth={2} /> : <span className="text-black/20">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {theirs ? <CheckCircle2 size={18} className="text-black/40 mx-auto" strokeWidth={2} /> : <span className="text-black/20">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 lg:py-32 bg-[#171717]">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10 text-center')}>
        <h2 className="text-[32px] sm:text-[42px] lg:text-[56px] font-semibold tracking-[-0.04em] leading-[1.05] text-white mb-6">
          See the portal for yourself.
        </h2>
        <p className="text-[18px] text-white/50 mb-10 max-w-[480px] mx-auto">
          Submit 3 images free. No credit card. Your edited results appear in the portal within 24 hours.
        </p>
        <Link
          to="/free-trial"
          className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-[16px] hover:scale-105 transition-transform"
        >
          Try free — 3 images
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  </div>
);

export default PlatformPage;
