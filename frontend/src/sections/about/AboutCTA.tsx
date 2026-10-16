import { useNavigate, Link } from 'react-router-dom';
import { cx, layout, typography } from '../../utils/theme';
import { ButtonWithIcon } from '../../components/ui/button-with-icon';
import { useContent } from '../../context/ContentBase';
import Frame from '../../components/ui/Frame';

const AboutCTA = () => {
  const { isUserAuthenticated } = useContent();
  const navigate = useNavigate();

  return (
    <section className="px-5 sm:px-6 lg:px-12 pt-10 pb-10 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-20 bg-white">
      <div className={cx(layout.compactShell)}>
          <div className="bg-[var(--color-text-primary)] rounded-[28px] p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.08)]">

            <div className="relative z-10">
              <h2 className={cx(typography.vercelSection, 'text-white mb-4 sm:mb-6 lg:mb-8')}>
                Scale your catalog without <br />
                <span className="text-white/40">the enterprise minimums.</span>
              </h2>

              <div className="flex justify-center mb-5 sm:mb-7 lg:mb-10">
                <ButtonWithIcon
                  variant="white"
                  label={isUserAuthenticated ? 'Start Editing' : 'Get 3 Free Sample Edits'}
                  animated={false}
                  onClick={() => navigate(isUserAuthenticated ? '/dashboard?view=new-project' : '/free-trial')}
                />
              </div>

              <p className="text-[10px] sm:text-[11px] lg:text-[12px] font-heading font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] text-white/40">
                3 free image edits &bull; no credit card required &bull; response within 30 minutes
              </p>
            </div>
          </div>
      </div>

      {/* Internal Links Section */}
      <div className={cx(layout.compactShell, "mt-16")}>
        <div className="text-center mb-10">
          <h3 className={cx(typography.vercelMono, "text-black/60 uppercase tracking-widest mb-4")}>
            Explore Reframe Visuals
          </h3>
          <p className="text-[16px] text-[#666] max-w-2xl mx-auto">
            Browse our services and pricing, or see what teams use Reframe for.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Link
            to="/services"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Services
          </Link>
          <Link
            to="/pricing"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Pricing
          </Link>
          <Link
            to="/free-trial"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Free Trial
          </Link>
          <Link
            to="/blog"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Blog
          </Link>
          <Link
            to="/case-studies"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Case Studies
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Contact
          </Link>
          <Link
            to="/who-is-reframe-visuals"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Who We Are
          </Link>
          <Link
            to="/reframe-visuals-brand-facts"
            className="rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-[var(--color-text-primary)] hover:text-white transition-colors text-center"
          >
            Brand Facts
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutCTA;
