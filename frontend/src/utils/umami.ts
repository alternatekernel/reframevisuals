declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function trackEvent(eventName: string, data?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && window.umami?.track) {
    window.umami.track(eventName, data);
  }
}

// Named event helpers for key conversion actions
export const track = {
  freeTrial:         (page?: string) => trackEvent('free-trial-click',       { page }),
  quoteBuilder:      (step?: string) => trackEvent('quote-builder',          { step }),
  quoteSubmit:       (service?: string, price?: number) => trackEvent('quote-submit', { service, price }),
  contactForm:       ()              => trackEvent('contact-form-submit'),
  newsletterSubscribe: ()            => trackEvent('newsletter-subscribe'),
  blogRead:          (slug: string, readTime?: string) => trackEvent('blog-read', { slug, readTime }),
  ctaClick:          (label: string, location?: string) => trackEvent('cta-click', { label, location }),
  pricingView:       ()              => trackEvent('pricing-view'),
  portfolioView:     ()              => trackEvent('portfolio-view'),
};
