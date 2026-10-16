import React from 'react';
import { cx, layout, typography } from '../../utils/theme';

const defaultSteps = [
  { title: 'Upload images.', desc: 'Send product photos and optional references.' },
  { title: 'Editors process.', desc: 'Human editors apply the selected service and related cleanup.' },
  { title: 'QA review.', desc: 'Files are checked for consistency, edges, color, and ecommerce readiness.' },
  { title: 'Delivery.', desc: 'You review results, request revisions if needed, and scale into paid orders.' },
];

interface ServiceProcessStepsProps {
  service?: any;
}

const ServiceProcessSteps: React.FC<ServiceProcessStepsProps> = ({ service }) => {
  const steps = service?.servicePageContent?.process?.length ? service.servicePageContent.process : defaultSteps;

  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className={cx('rounded-[28px] p-8 lg:p-16 border border-black/10 bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.05)]')}>
          <h2 className={cx('text-[32px] lg:text-[40px] font-bold tracking-tight', typography.sectionTitleInk)}>How It’s Done</h2>
          {service?.servicePageContent?.seoParagraph && (
            <p className="mt-4 max-w-3xl text-[16px] lg:text-[18px] font-medium leading-relaxed text-black/60">
              {service.servicePageContent.seoParagraph}
            </p>
          )}
          <ol className="mt-10 grid gap-8 md:gap-10 md:grid-cols-4">
            {steps.map((step: any, index: number) => (
              <li className="space-y-3" key={`${step.title}-${index}`}>
                <strong className="block text-[20px] lg:text-[22px] text-[var(--color-text-primary)] font-bold">{index + 1}. {step.title}</strong>
                <span className="block text-[16px] lg:text-[18px] font-medium leading-relaxed text-black/60">{step.desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default ServiceProcessSteps;
