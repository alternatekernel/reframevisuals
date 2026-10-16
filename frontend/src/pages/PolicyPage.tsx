import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';

type PolicyContent = {
  title: string;
  description: string;
  updated: string;
  sections: Array<{ heading: string; body: string[] }>;
};

const POLICIES: Record<string, PolicyContent> = {
  '/privacy': {
    title: 'Privacy Policy',
    description: 'How Reframe Visuals collects, uses, protects, and handles customer information and uploaded project assets.',
    updated: 'June 8, 2026',
    sections: [
      { heading: 'Information we collect', body: ['We collect information customers submit through forms, accounts, project briefs, uploads, email, and support conversations.', 'This may include name, business email, company details, billing or order references, project instructions, and uploaded visual assets.'] },
      { heading: 'How we use information', body: ['We use information to answer enquiries, process sample edits and paid orders, provide support, improve service quality, prevent abuse, and maintain operational records.', 'We do not sell customer project assets. Uploaded assets are used only to provide the requested service unless a customer gives explicit permission for another use.'] },
      { heading: 'Data protection', body: ['We apply reasonable administrative, technical, and organizational controls to protect customer information in transit, at rest, and during production workflows.', 'Access is limited to authorized personnel and service providers who need it to deliver or support the service.'] },
      { heading: 'Your choices', body: ['Customers may request correction, deletion, or export of their personal information by contacting hello@reframevisuals.com.', 'Some operational records may be retained where required for fraud prevention, accounting, legal compliance, or dispute resolution.'] },
    ],
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'The service terms for using Reframe Visuals photo editing, sample edit, order, and customer portal workflows.',
    updated: 'June 8, 2026',
    sections: [
      { heading: 'Service scope', body: ['Reframe Visuals provides ecommerce photo editing, retouching, visual production, and related support services.', 'Project scope, turnaround, delivery requirements, and pricing may vary by brief complexity, volume, and selected service tier.'] },
      { heading: 'Customer responsibilities', body: ['Customers are responsible for providing lawful assets, clear instructions, accurate contact details, and permission to use submitted materials for production.', 'Customers should review previews and final files promptly and report revision requests with clear notes.'] },
      { heading: 'Payment and delivery', body: ['Paid work may require confirmation, invoice acceptance, or payment before delivery depending on the project arrangement.', 'Delivery estimates begin after required assets, instructions, and approvals are received.'] },
      { heading: 'Acceptable use', body: ['Customers may not use the platform to submit illegal, harmful, infringing, abusive, or deceptive materials.', 'We may refuse, pause, or terminate work that creates legal, safety, payment, or platform integrity risk.'] },
    ],
  },
  '/cookies': {
    title: 'Cookie Policy',
    description: 'How Reframe Visuals uses necessary, analytics, preference, and advertising-related cookies and how visitors can opt out.',
    updated: 'June 8, 2026',
    sections: [
      { heading: 'Cookie use', body: ['We use cookies and similar technologies to operate the site, remember preferences, understand performance, improve support, and measure marketing effectiveness.', 'Necessary cookies support core functions such as consent choices, account sessions, and security controls.'] },
      { heading: 'Optional cookies', body: ['Analytics, personalization, and advertising-related cookies may help us understand page performance and improve visitor experience.', 'Where required, visitors may opt out through the cookie banner or browser-level controls.'] },
      { heading: 'Managing preferences', body: ['You can clear or block cookies in your browser settings at any time.', 'If you opt out on this site, we store that preference locally so the banner does not need to ask repeatedly.'] },
    ],
  },
  '/security': {
    title: 'Security Overview',
    description: 'Security practices for Reframe Visuals customer assets, account access, operational controls, and responsible disclosure.',
    updated: 'June 8, 2026',
    sections: [
      { heading: 'Asset handling', body: ['Customer assets are handled through controlled production workflows and are not shared outside authorized service delivery needs.', 'Access to project files is limited to personnel and systems required to complete, review, or support the order.'] },
      { heading: 'Transport and platform controls', body: ['The public site enforces HTTPS and security headers including HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, and nosniff.', 'Administrative and portal actions use authenticated access controls and rate-limited API surfaces.'] },
      { heading: 'Operational safeguards', body: ['We monitor service health, review audit findings, and address security matters according to severity and customer impact.', 'Customers should use strong passwords, protect account access, and report suspicious activity quickly.'] },
      { heading: 'Responsible disclosure', body: ['Security concerns can be sent to hello@reframevisuals.com with enough detail to reproduce and assess the matter.', 'Please avoid destructive testing, data extraction, account takeover attempts, or privacy-impacting actions.'] },
    ],
  },
};

const PolicyPage: React.FC = () => {
  const location = useLocation();
  const policy = POLICIES[location.pathname] || POLICIES['/privacy'];
  const canonical = `https://reframevisuals.com${location.pathname}`;

  return (
    <main className="bg-white px-4 py-12 text-[var(--color-text-primary)] sm:px-6 lg:px-8 lg:py-20">
      <Helmet>
        <title>{`${policy.title} | Reframe Visuals`}</title>
        <meta name="description" content={policy.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`${policy.title} | Reframe Visuals`} />
        <meta property="og:description" content={policy.description} />
        <meta property="og:url" content={canonical} />
      </Helmet>
      <div className="mx-auto max-w-3xl">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-black/40">Legal and trust</p>
        <h1 className="mt-3 text-[36px] font-bold leading-tight tracking-[-0.04em] sm:text-[48px]">{policy.title}</h1>
        <p className="mt-4 text-[16px] leading-7 text-black/60">{policy.description}</p>
        <p className="mt-4 text-[13px] font-semibold text-black/45">Last updated: {policy.updated}</p>
        <div className="mt-10 space-y-8">
          {policy.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-black/10 bg-[var(--color-bg-secondary)] p-6">
              <h2 className="text-[20px] font-bold tracking-tight">{section.heading}</h2>
              <div className="mt-4 space-y-3 text-[16px] leading-7 text-black/65">
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-black/10 p-6 text-[16px] leading-7 text-black/65">
          Questions about this page? Contact <a className="font-semibold text-black underline" href="mailto:hello@reframevisuals.com">hello@reframevisuals.com</a> or return to the <Link className="font-semibold text-black underline" to="/contact">contact page</Link>.
        </div>
      </div>
    </main>
  );
};

export default PolicyPage;
