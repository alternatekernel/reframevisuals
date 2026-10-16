import React from 'react';
import { cx, layout, typography } from '../../utils/theme';
import Frame from '../../components/ui/Frame';
import { NEWSLETTER_EMAIL } from '../../constants/contact';

const BlogCTA: React.FC = () => {
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success'>('idle');

  return (
    <section className="px-5 pb-12 sm:px-6 sm:pb-24">
      <div className={cx(layout.compactShell)}>
        <Frame size="lg" className="border-none bg-[#171717]">
          <div className="relative overflow-hidden px-6 py-12 sm:px-12 sm:py-20 lg:p-20 text-center lg:text-left">
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
              <img src="/logo.svg" alt="Reframe Brand Element CTA" className="h-[400px] w-[400px] invert" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              {/* Left Column: Promotion */}
              <div className="space-y-6 lg:space-y-8">
                <h2 className="font-heading text-[28px] font-black leading-tight tracking-tight text-white sm:text-[36px] lg:text-[44px]">
                  Ready to See <br />
                  <span className="text-white/60">the Difference?</span>
                </h2>

                <p className="max-w-xl text-[15px] leading-relaxed text-white/60 sm:text-[16px] lg:text-[17px] mx-auto lg:mx-0">
                  Put these techniques to work. Start with 3 free edits and experience professional image editing firsthand.
                </p>

                <div className="flex flex-col items-center lg:items-start gap-4">
                  <button
                    onClick={() => {
                      window.location.href = '/free-trial';
                    }}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-[15px] font-bold text-[#171717] transition-all hover:bg-white/90 active:scale-95"
                  >
                    Get 3 Free Sample Edits
                  </button>

                  <p className={cx(typography.vercelMono, 'text-[11px] text-white/45 tracking-widest text-center lg:text-left')}>
                    3 FREE IMAGE EDITS &bull; NO CREDIT CARD REQUIRED
                  </p>
                </div>
              </div>

              {/* Right Column: Newsletter Subscription */}
              <div className="w-full space-y-4 lg:border-l lg:border-white/10 lg:pl-12">
                <p className="text-[12px] font-bold tracking-widest text-white/40 uppercase text-center lg:text-left">
                  Get blog updates weekly
                </p>

                {submitState !== 'success' ? (
                  <div className="group relative max-w-sm mx-auto lg:mx-0">
                    <input
                      type="email"
                      id="insights-newsletter-email"
                      placeholder="Your email address"
                      className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-5 pr-[7.5rem] text-[13px] font-medium text-white transition-[border-color,box-shadow,background-color] duration-200 placeholder-white/40 focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 sm:h-14 sm:pl-6 sm:pr-[8.5rem] sm:text-[14px]"
                    />
                    <button
                      onClick={async () => {
                        const emailInput = document.getElementById('insights-newsletter-email') as HTMLInputElement;
                        const email = emailInput?.value;
                        if (!email || !email.includes('@')) return;

                        setSubmitState('submitting');
                        try {
                          await fetch('/api/portal/inquiry', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email,
                              metadata: { type: 'Blog Newsletter Subscription', source: 'Blog Page' },
                            }),
                          });
                          setSubmitState('success');
                        } catch (err) {
                          setSubmitState('idle');
                        }
                      }}
                      className="absolute right-1.5 top-1.5 h-9 rounded-full border border-white/10 bg-white px-4 text-[12px] font-bold text-black transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-50 sm:right-2 sm:top-2 sm:h-10 sm:px-5"
                      disabled={submitState === 'submitting'}
                    >
                      {submitState === 'submitting' ? '...' : 'Subscribe'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center lg:text-left">
                    <p className="text-[14px] font-bold text-white">Subscription Confirmed</p>
                    <p className="mt-1 text-[12px] font-medium text-white/60">No spam, just blog updates. Guaranteed.</p>
                  </div>
                )}

                <p className="text-[11px] font-medium italic text-white/25 text-center lg:text-left">
                  * No spam or annoying sales messages, guaranteed.
                </p>
                <p className="text-[12px] font-medium text-white/40 text-center lg:text-left">
                  Prefer email?{' '}
                  <a
                    href={`mailto:${NEWSLETTER_EMAIL}`}
                    className="underline decoration-white/30 hover:decoration-white"
                  >
                    {NEWSLETTER_EMAIL}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Frame>
      </div>
    </section>
  );
};

export default BlogCTA;
