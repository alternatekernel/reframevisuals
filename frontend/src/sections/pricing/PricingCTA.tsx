import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx, layout, tokens, typography } from '../../utils/theme';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { Button } from '../../components/ui/button';
import { PublicInput } from '../../components/ui/form-controls';
import Frame from '../../components/ui/Frame';

const PricingCTA = () => {
  const navigate = useNavigate();
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success'>('idle');

  return (
    <section className="relative overflow-hidden bg-white px-6 py-16 lg:py-20 lg:px-12">
      <div className={cx(layout.compactShell, 'relative z-10')}>
        <Frame extended size="lg" className="w-full max-w-5xl">
          <div className="w-full px-4 py-12 text-center lg:px-12">
            <div className={cx(typography.vercelMono, 'mb-10')}>
              Volume Pricing
            </div>

            <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, 'mb-8')}>
              Processing 500+ images? <br />
              <span className="text-[var(--color-text-muted)]">Book a call for custom pricing.</span>
            </h2>

            <p className="mx-auto mb-8 max-w-2xl text-[18px] font-normal leading-relaxed text-[var(--color-text-secondary)] lg:text-[20px]">
              For high-volume catalogs we work out dedicated editors, custom turnaround
              windows, and pricing that reflects your actual order size.
            </p>

            <div className="mx-auto mb-10 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-black/[0.18] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Reply SLA</p>
                <p className="mt-1 text-[18px] font-black text-[var(--color-text-primary)]">≤ 30 min</p>
              </div>
              <div className="rounded-2xl border border-black/[0.18] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Quality control</p>
                <p className="mt-1 text-[18px] font-black text-[var(--color-text-primary)]">Manual QA</p>
              </div>
              <div className="rounded-2xl border border-black/[0.18] bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/50">Turnaround</p>
                <p className="mt-1 text-[18px] font-black text-[var(--color-text-primary)]">12h–72h options</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6">
              <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                <ButtonWithIcon
                  onClick={() => navigate('/book-meeting')}
                  variant="default"
                  label="Get Pricing Breakdown"
                  className="!w-full sm:!w-auto"
                  animated={false}
                />
                <Button
                  onClick={() => navigate('/services')}
                  variant="white"
                  className="h-12 w-full rounded-full px-6 text-sm font-medium sm:w-auto"
                >
                  Explore Services
                </Button>
              </div>

              <div className="w-full max-w-sm space-y-4 border-t border-black/[0.12] pt-8">
                <p className="text-[14px] font-bold tracking-widest text-[var(--color-text-secondary)]">Or get a custom quote via email</p>

                {submitState !== 'success' ? (
                  <div className="group relative">
                    <PublicInput
                      type="email"
                      id="pricing-cta-email"
                      placeholder="Enter your work email"
                      shape="pill"
                      className="h-14 bg-[var(--color-bg-secondary)] pl-6 pr-40 text-[14px] font-bold focus:border-black/20 placeholder:text-black/40 placeholder:font-normal"
                    />
                    <button
                      onClick={async () => {
                        const emailInput = document.getElementById('pricing-cta-email') as HTMLInputElement;
                        const email = emailInput?.value;
                        if (!email || !email.includes('@')) return;

                        setSubmitState('submitting');
                        try {
                          await fetch('/api/portal/inquiry', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email,
                              metadata: { type: 'Pricing Page Custom Pricing Breakdown', source: 'Pricing CTA' },
                            }),
                          });
                          setSubmitState('success');
                        } catch (err) {
                          setSubmitState('idle');
                        }
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 group inline-flex items-center justify-center gap-1.5 text-[14px] font-bold text-[var(--color-text-primary)] transition-all disabled:opacity-50"
                      disabled={submitState === 'submitting'}
                    >
                      <span className="relative">
                        {submitState === 'submitting' ? '...' : 'Request Custom Quote'}
                        <span className={tokens.interactiveUnderline} />
                      </span>
                      <ArrowRight size={14} className="text-black/40 transition-all duration-300 group-hover:-rotate-45 group-hover:text-black/70 shrink-0" />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
                    <p className="text-[14px] font-bold text-green-700">Quote Request Sent</p>
                    <p className="mt-1 text-[11px] font-medium text-green-600/80">Our specialists will reach out in 5 minutes.</p>
                  </div>
                )}

                <p className="text-[14px] text-[var(--color-text-secondary)]">
                  Prefer email?{' '}
                  <a href="mailto:hello@reframevisuals.com" className="text-[var(--color-text-primary)] underline">
                    hello@reframevisuals.com
                  </a>
                </p>
                <p className="text-[12px] font-medium text-[var(--color-text-muted)]">
                  No spam. Replies within 30 min.
                </p>
              </div>
            </div>
          </div>
        </Frame>
      </div>
    </section>
  );
};

export default PricingCTA;
