import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, Zap, Users, Clock, HelpCircle, Mail, ChevronRight } from 'lucide-react';
import ReframeCSShowcase from '../sections/ReframeCSShowcase';

const openSupportChat = () => {
  window.dispatchEvent(new CustomEvent('reframe-cs:open', { detail: { focus: true } }));
};

const supportSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://reframevisuals.com/support#webpage',
      'url': 'https://reframevisuals.com/support',
      'name': 'Support - Reframe Visuals',
      'description': 'Get instant support from ReframeCS, Reframe Visuals built-in assistant. Ask about orders, pricing, revisions, and specifications with human handoff available 24/7.',
      'inLanguage': 'en',
      'isPartOf': { '@id': 'https://reframevisuals.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://reframevisuals.com' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Support', 'item': 'https://reframevisuals.com/support' },
        ],
      },
      'dateModified': new Date().toISOString(),
    },
    {
      '@type': 'WebSite',
      '@id': 'https://reframevisuals.com/#website',
      'url': 'https://reframevisuals.com',
      'name': 'Reframe Visuals',
      'publisher': { '@id': 'https://reframevisuals.com/#organization' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://reframevisuals.com/#organization',
      'name': 'Reframe Visuals',
      'url': 'https://reframevisuals.com',
      'logo': 'https://reframevisuals.com/logo.svg',
      'email': 'hello@reframevisuals.com',
      'description': 'Ecommerce photo editing studio. Background removal, ghost mannequin, clipping path, jewelry retouching, and color correction. Human editors, manual QA on every image.',
      'areaServed': 'Worldwide',
      'sameAs': [
        'https://www.linkedin.com/company/reframe-visuals/',
        'https://www.instagram.com/reframevisualsstudio/',
        'https://www.pinterest.com/reframevisuals/',
        'https://www.behance.net/reframevisuals',
        'https://x.com/ReframeVisual',
        'https://www.trustpilot.com/review/reframevisuals.com',
        'https://www.tiktok.com/@reframe_visuals',
      ],
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'contactType': 'customer support',
          'url': 'https://reframevisuals.com/support',
          'email': 'hello@reframevisuals.com',
          'availableLanguage': 'English',
          'areaServed': 'Worldwide',
          'hoursAvailable': {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            'opens': '00:00',
            'closes': '23:59',
          },
        },
        {
          '@type': 'ContactPoint',
          'contactType': 'sales',
          'url': 'https://reframevisuals.com/contact',
          'email': 'hello@reframevisuals.com',
          'availableLanguage': 'English',
          'areaServed': 'Worldwide',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://reframevisuals.com/support#faq',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'How do I contact Reframe Visuals support?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Open the ReframeCS chat from the bottom-right corner of any page on reframevisuals.com, visit reframevisuals.com/support and click "Open Support Chat", or email hello@reframevisuals.com directly.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How fast does Reframe Visuals support respond?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'ReframeCS answers common questions instantly via AI. Human support teammates reply within 30 minutes. The chat is available 24 hours a day, 7 days a week.',
          },
        },
        {
          '@type': 'Question',
          'name': 'What can I ask Reframe Visuals support about?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'You can ask about active order status, delivery timelines, revision requests, file specifications, bulk pricing quotes, billing questions, or any service enquiry. Complex issues are routed to a human team member.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Does Reframe Visuals have a live chat?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. ReframeCS is a built-in live support chat on reframevisuals.com. It combines instant AI responses with human agent handoff for complex or billing-related issues. It is accessible from the bottom-right corner of every page or at reframevisuals.com/support.',
          },
        },
        {
          '@type': 'Question',
          'name': 'What information should I include when contacting Reframe Visuals support?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Include your order ID if applicable, a clear description of the issue or question, your deadline, and the specific service name (e.g. background removal, ghost mannequin, clipping path). The more specific your message, the faster the team can help.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Can I get a quote through Reframe Visuals support chat?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. Describe your image volume, required service, and deadline in the ReframeCS chat and you will receive an instant price estimate. For complex bulk orders a human team member will follow up within 30 minutes.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Does Reframe Visuals support handle revision requests?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. Share your order ID and describe the specific revision needed, for example "the background on image 12 has a grey fringe on the left edge", and the support team will process the correction.',
          },
        },
      ],
    },
  ],
};

const WHEN_TO_USE = [
  {
    icon: FileText,
    title: 'Order questions',
    description: 'Ask about your order status, delivery time, or a revision on an active job.',
  },
  {
    icon: Zap,
    title: 'Quick quotes',
    description: 'Share your volume and service and we will give you a price straight away.',
  },
  {
    icon: Users,
    title: 'Human support',
    description: 'Billing issues and complaints go straight to a real person. The AI steps aside.',
  },
  {
    icon: Clock,
    title: 'Always on',
    description: 'ReframeCS is live 24/7. A human teammate replies within 30 minutes.',
  },
];

const GOOD_QUESTIONS = [
  {
    label: 'Reference your order ID',
    example: '"Order #RV-00492: can you confirm the delivery ETA and whether clipping paths are included?"',
  },
  {
    label: 'Describe exactly what is wrong',
    example: '"Image 12 still has a grey fringe on the left edge after the revision. Can you redo it?"',
  },
  {
    label: 'Lead with your deadline',
    example: '"340 SKUs needing background removal, deadline Friday 18:00 UTC. What is the price?"',
  },
  {
    label: 'Name the service',
    example: '"Ghost mannequin on 50 jacket images, neck join only, no sleeve joins. What do you need from me?"',
  },
];

const SupportPage: React.FC = () => {
  return (
    <div className="bg-white">
      <Helmet>
        <title>Support - Reframe Visuals | Live Chat and Help 24/7</title>
        <meta
          name="description"
          content="Get support from ReframeCS, Reframe Visuals built-in live chat. Ask about orders, pricing, revisions, and file specs. Human teammates reply within 30 minutes, 24/7."
        />
        <link rel="canonical" href="https://reframevisuals.com/support" />
        <meta property="og:title" content="Support - Reframe Visuals | Live Chat and Help 24/7" />
        <meta property="og:description" content="Live chat support for orders, revisions, pricing, and specifications. AI answers instantly. Human teammates reply within 30 minutes, 24/7." />
        <meta property="og:url" content="https://reframevisuals.com/support" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Support - Reframe Visuals | Live Chat and Help 24/7" />
        <meta name="twitter:description" content="Live chat support for orders, revisions, pricing, and specifications. AI answers instantly. Human teammates reply within 30 minutes, 24/7." />
        <script type="application/ld+json">{JSON.stringify(supportSchema)}</script>
      </Helmet>

      {/* Hero: live chat showcase */}
      <ReframeCSShowcase
        title="Talk to us now."
        subtitle="Type a question below and ReframeCS will reply straight away. A human teammate is one message away."
      />

      {/* Body sections */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[80px] right-[-60px] w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-violet-200/15 to-indigo-200/15 blur-[90px]" />
          <div className="absolute bottom-[80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-sky-200/10 to-blue-200/10 blur-[90px]" />
        </div>

        <div className="mx-auto w-full max-w-5xl relative z-10 space-y-6 pt-6">

          {/* What you can ask */}
          <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] p-8 sm:p-10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-black/35 mb-6">What you can ask</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {WHEN_TO_USE.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-black/[0.05]">
                  <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-black/[0.05]">
                    <Icon size={18} className="text-black/50" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-[var(--color-text-primary)]">{title}</p>
                    <p className="mt-1.5 text-[15px] text-black/55 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to ask + sidebar */}
          <div className="flex flex-col md:flex-row gap-6">

            {/* Good question examples */}
            <div className="flex-1 relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] p-8 sm:p-10">
              <div className="flex items-center gap-2.5 mb-4">
                <HelpCircle size={18} className="text-black/30" strokeWidth={1.8} />
                <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-black/35">How to ask</h2>
              </div>
              <p className="text-[15px] text-black/55 mb-7 leading-relaxed">
                Give us specifics and we can sort it faster. Here is what a useful message looks like:
              </p>
              <div className="space-y-5">
                {GOOD_QUESTIONS.map(({ label, example }) => (
                  <div key={label} className="border-l-2 border-black/10 pl-4">
                    <p className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">{label}</p>
                    <p className="text-[14px] text-black/50 leading-relaxed italic">{example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:w-[300px] shrink-0 flex flex-col gap-6">

              <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[var(--color-bg-secondary)] shadow-[0_14px_40px_rgba(0,0,0,0.04)] p-7 flex-1">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-black/35 mb-5">What to expect</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Instant answers</p>
                    <p className="text-[14px] text-black/55 mt-1.5 leading-relaxed">Pricing, service, and spec questions get a reply straight away.</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Human handoff</p>
                    <p className="text-[14px] text-black/55 mt-1.5 leading-relaxed">Billing and complaints go to a real person. You do not need to ask.</p>
                  </div>
                  <div>
                    <p className="text-[16px] font-bold text-[var(--color-text-primary)]">30-min human reply</p>
                    <p className="text-[14px] text-black/55 mt-1.5 leading-relaxed">A teammate picks it up within 30 minutes. The chat runs all day, every day.</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[var(--color-text-primary)] shadow-[0_14px_40px_rgba(0,0,0,0.1)] p-7">
                <p className="text-[18px] font-bold text-white leading-snug">Need help now?</p>
                <p className="mt-2 text-[14px] text-white/55 leading-relaxed">Use the chat at the top of this page or click below.</p>
                <button
                  onClick={openSupportChat}
                  className="mt-5 inline-flex w-full min-h-11 items-center justify-between rounded-full bg-white px-5 text-[15px] font-bold text-[var(--color-text-primary)] hover:bg-white/90 active:scale-95 transition-all"
                >
                  Start a conversation
                  <ChevronRight size={16} />
                </button>
                <a
                  href="mailto:hello@reframevisuals.com"
                  className="mt-3 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-[14px] font-semibold text-white/70 hover:text-white hover:border-white/30 transition-all"
                >
                  <Mail size={14} />
                  hello@reframevisuals.com
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SupportPage;
