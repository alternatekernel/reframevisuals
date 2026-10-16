import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { tokens } from '../utils/theme';
import ReframeCSShowcase from '../sections/ReframeCSShowcase';

type ContactFormState = { name: string; email: string; company: string; message: string };

const initialForm: ContactFormState = { name: '', email: '', company: '', message: '' };

const helpSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      '@id': 'https://reframevisuals.com/contact#webpage',
      'url': 'https://reframevisuals.com/contact',
      'name': 'Help and Contact - Reframe Visuals',
      'description': 'Chat with ReframeCS or send a message. Get answers on orders, pricing, revisions, and file specs. Human teammates reply within 30 minutes, 24/7.',
      'inLanguage': 'en',
      'isPartOf': { '@id': 'https://reframevisuals.com/#website' },
      'breadcrumb': {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://reframevisuals.com' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Help', 'item': 'https://reframevisuals.com/contact' },
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
          'url': 'https://reframevisuals.com/contact',
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
      '@id': 'https://reframevisuals.com/contact#faq',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'How do I contact Reframe Visuals?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Use the ReframeCS live chat at reframevisuals.com/contact, or email hello@reframevisuals.com. Human teammates reply within 30 minutes.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How fast does Reframe Visuals respond?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'ReframeCS answers common questions instantly. Human teammates reply within 30 minutes. Support runs 24 hours a day, 7 days a week.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Does Reframe Visuals have a live chat?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. ReframeCS is a built-in live chat on reframevisuals.com. It combines instant AI answers with human agent handoff for complex or billing issues.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Can I get a quote through the contact page?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. Describe your image volume, required service, and deadline in the chat or the contact form and you will receive a price straight away.',
          },
        },
        {
          '@type': 'Question',
          'name': 'Does Reframe Visuals offer free sample edits?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. New customers get 3 images edited completely free before placing a paid order. Ask about it in the chat or contact form.',
          },
        },
      ],
    },
  ],
};

const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ContactFormState>(initialForm);

  const updateField = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (form.name.trim().length < 2) return 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid work email.';
    if (form.message.trim().length < 10) return 'Please add a short message.';
    return '';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          metadata: {
            type: 'Contact Page',
            name: form.name.trim(),
            email: form.email.trim(),
            company: form.company.trim(),
            message: form.message.trim(),
          },
        }),
      });
      if (!response.ok) throw new Error('failed');
      setSubmittedEmail(form.email.trim());
      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setError('Could not send your message. Email hello@reframevisuals.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Help and Contact - Reframe Visuals | Reply in 30 Minutes</title>
        <meta
          name="description"
          content="Chat with ReframeCS or send a message to Reframe Visuals. Get answers on orders, pricing, revisions, and file specs. Human teammates reply within 30 minutes, 24/7."
        />
        <link rel="canonical" href="https://reframevisuals.com/contact" />
        <meta property="og:title" content="Help and Contact - Reframe Visuals | Reply in 30 Minutes" />
        <meta property="og:description" content="Chat now or send a message. Answers on orders, pricing, and revisions. Human reply within 30 minutes, 24/7." />
        <meta property="og:url" content="https://reframevisuals.com/contact" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Help and Contact - Reframe Visuals | Reply in 30 Minutes" />
        <meta name="twitter:description" content="Chat now or send a message. Answers on orders, pricing, and revisions. Human reply within 30 minutes, 24/7." />
        <script type="application/ld+json">{JSON.stringify(helpSchema)}</script>
      </Helmet>

      {/* Hero: live chat */}
      <ReframeCSShowcase
        title="Talk to us."
        subtitle="Start a live chat right now or leave your email below and we will reach out. A real human replies within minutes, every time."
      />

      {/* Contact form + tips */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 pt-6 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[80px] right-[-50px] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-sky-200/20 to-indigo-200/20 blur-[80px] opacity-70" />
          <div className="absolute bottom-[50px] left-[-50px] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-teal-200/10 to-blue-200/15 blur-[90px] opacity-70" />
        </div>

        <div className="mx-auto w-full max-w-5xl relative z-10 space-y-6">

          {/* Contact form card */}
          <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] flex flex-col md:flex-row">
            <div className="pointer-events-none absolute inset-0">
              <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 opacity-[0.035]" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/40" />
            </div>

            {/* Form */}
            <div className="relative z-10 w-full md:w-[60%] p-6 sm:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-black/5">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-[36px] sm:text-[40px] lg:text-[48px] font-bold leading-[1.05] tracking-tight text-[var(--color-text-primary)]">Send a message</h1>
                <p className="text-[16px] text-black/60 leading-relaxed">
                  Or email us directly at{' '}
                  <a className="group relative text-black font-semibold inline-block" href="mailto:hello@reframevisuals.com">
                    hello@reframevisuals.com
                    <span className={tokens.interactiveUnderline} />
                  </a>
                </p>
              </div>

              {!submitted ? (
                <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4" aria-describedby={error ? 'contact-form-error' : undefined}>
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-[14px] font-semibold text-black/70">Name <span className="text-red-600">*</span></label>
                    <input id="contact-name" name="name" required autoComplete="name" className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white" placeholder="Your name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-[14px] font-semibold text-black/70">Work email <span className="text-red-600">*</span></label>
                    <input id="contact-email" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white" placeholder="you@company.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="contact-company" className="mb-1.5 block text-[14px] font-semibold text-black/70">Company</label>
                    <input id="contact-company" name="company" autoComplete="organization" className="w-full rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white" placeholder="Company name" value={form.company} onChange={(e) => updateField('company', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="mb-1.5 block text-[14px] font-semibold text-black/70">How can we help? <span className="text-red-600">*</span></label>
                    <textarea id="contact-message" name="message" required minLength={10} className="h-28 w-full resize-none rounded-xl border border-black/10 bg-[var(--color-bg-secondary)] px-4 py-3.5 text-[16px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 focus:border-black/30 focus:bg-white" placeholder="Tell us about your images, volume, deadline, or editing needs." value={form.message} onChange={(e) => updateField('message', e.target.value)} />
                  </div>
                  {error && <p id="contact-form-error" role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">{error}</p>}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full bg-[var(--color-text-primary)] px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-black active:scale-95 disabled:opacity-60">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                    <a href="/book-meeting" className="inline-flex min-h-12 w-full sm:w-max items-center justify-center rounded-full border border-black/10 bg-white px-6 text-[15px] font-semibold text-[var(--color-text-primary)] shadow-sm transition-all duration-300 hover:bg-[var(--color-bg-secondary)]">Book 15-min Call</a>
                  </div>
                </form>
              ) : (
                <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-6 text-center" role="status">
                  <p className="text-[16px] font-bold text-green-700">Message Sent</p>
                  <p className="mt-2 text-[14px] text-green-600/80">
                    We will reply to <span className="font-semibold">{submittedEmail}</span> within 30 minutes.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="relative z-10 w-full md:w-[40%] bg-[var(--color-bg-secondary)] p-6 sm:p-10 flex flex-col justify-center border-t md:border-t-0 border-black/5">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-black/40 mb-8">What to expect</h2>
              <div className="space-y-8">
                <div>
                  <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Reply within 30 minutes</p>
                  <p className="text-[14px] text-black/60 mt-1.5 leading-relaxed">Our team is online 24/7. No waiting days for a quote.</p>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[var(--color-text-primary)]">3 free sample edits</p>
                  <p className="text-[14px] text-black/60 mt-1.5 leading-relaxed">Want to check quality first? We edit your first 3 images for free.</p>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[var(--color-text-primary)]">Secure uploads</p>
                  <p className="text-[14px] text-black/60 mt-1.5 leading-relaxed">Your images stay in your portal. We never share them without permission.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to ask tips */}
          <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.04)] p-8 sm:p-10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.18em] text-black/35 mb-6">Get a faster reply</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="border-l-2 border-black/10 pl-4">
                <p className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1.5">Include your order ID</p>
                <p className="text-[14px] text-black/50 leading-relaxed italic">"Order #RV-00492: delivery ETA and clipping paths included?"</p>
              </div>
              <div className="border-l-2 border-black/10 pl-4">
                <p className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1.5">Name the service</p>
                <p className="text-[14px] text-black/50 leading-relaxed italic">"Ghost mannequin on 50 jackets, neck join only. What do you need?"</p>
              </div>
              <div className="border-l-2 border-black/10 pl-4">
                <p className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1.5">Lead with your deadline</p>
                <p className="text-[14px] text-black/50 leading-relaxed italic">"340 SKUs, background removal, deadline Friday 18:00 UTC. Price?"</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
