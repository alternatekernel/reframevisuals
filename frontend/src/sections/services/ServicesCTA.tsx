import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

interface ServicesCTAProps {
  isUserAuthenticated: boolean;
}

const ServicesCTA: React.FC<ServicesCTAProps> = ({ isUserAuthenticated }) => {
  return (
    <section className="px-6 py-24 lg:py-32 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[var(--color-bg-secondary)] px-6 py-16 sm:px-10 lg:px-16 lg:py-20 shadow-sm">
          <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[var(--color-brand-primary)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-[var(--color-brand-accent)]/10 blur-3xl" />

          <div className="relative text-center">
            <h2 className="text-4xl lg:text-6xl font-heading font-bold tracking-[-0.05em] text-[var(--color-text-primary)] mb-8 leading-tight">
              Send your first <br />
              <span className="text-black/40">batch today.</span>
            </h2>
            <p className="text-[20px] text-black/60 font-normal mb-12 max-w-2xl mx-auto">
              Human editors, transparent pricing, 24-72 hour turnaround.
            </p>

            <div className="flex flex-col items-center gap-6">
              <Button
                asChild
                variant="default"
                className="h-12 px-6 font-bold tracking-wide"
              >
                <Link to={isUserAuthenticated ? '/dashboard?view=new-project' : '/free-trial'}>
                  {isUserAuthenticated ? 'Start New Job' : 'Get 3 Free Sample Edits'}
                </Link>
              </Button>

              <p className="text-[12px] text-black/45 font-medium tracking-wide uppercase">
                {isUserAuthenticated ? '3 free edits remaining' : 'No credit card required'} | Review first, always
              </p>
              <p className="text-[16px] font-medium text-black/65">Need custom scope? Email <a href="mailto:hello@reframevisuals.com" className="underline">hello@reframevisuals.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesCTA;
