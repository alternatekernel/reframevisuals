import React from 'react';
import { Check } from 'lucide-react';
import { cx, layout, typography } from '../../utils/theme';

interface ServiceConversionProps {
  service: any;
}

const ServiceConversion: React.FC<ServiceConversionProps> = ({ service }) => {
  return (
    <section className="py-12 lg:py-20 bg-[var(--color-bg-secondary)]">
      <div className={cx(layout.compactShell, "px-6 lg:px-12")}>
        <div className="max-w-3xl space-y-12">
          <h2 className={cx('font-heading text-[var(--fluid-h2)] lg:text-[64px] font-bold tracking-[-0.04em] leading-[1.2]', typography.sectionTitleInk)}>
            What's included
          </h2>
          <div className="space-y-8">
            {service?.servicePageContent?.whatWeHandle && (
              <p className="text-[16px] lg:text-[18px] font-medium text-black/60 leading-relaxed max-w-2xl">
                {service.servicePageContent.whatWeHandle}
              </p>
            )}
            {service?.includes?.map((item: string, index: number) => (
              <div key={index} className="flex gap-5">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-text-primary)] flex items-center justify-center mt-0.5">
                  <Check size={16} className="text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[18px] lg:text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight mt-0.5">{item}</h4>
                </div>
              </div>
            ))}
            
            {/* Standard guarantee for all services */}
            <div className="flex gap-5">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-text-primary)] flex items-center justify-center mt-0.5">
                <Check size={16} className="text-white" />
              </div>
              <div className="space-y-1 mt-0.5">
                <h4 className="text-[18px] lg:text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight">Output in any preferred format</h4>
                <p className="text-[16px] lg:text-[18px] font-medium text-black/60 leading-relaxed max-w-xl mt-2">
                  Files delivered in any format you need such as PSD, JPEG, or TIFF, ready for immediate use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceConversion;
