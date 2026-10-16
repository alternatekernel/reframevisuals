import React from 'react';
import { cx, layout, tokens, typography } from '../../utils/theme';
import { Link } from 'react-router-dom';

interface ServicePricingBoxProps {
  service: any;
}

const ServicePricingBox: React.FC<ServicePricingBoxProps> = ({ service }) => {
  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
          <div className={cx('rounded-[28px] p-10 lg:p-16 border border-black/10 bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.05)]', tokens.motionLift)}>
            <h2 className={cx('text-[28px] lg:text-[32px] font-bold tracking-tight', typography.sectionTitleInk)}>Pricing for {service.name}</h2>
            <p className="mt-4 text-[18px] lg:text-[20px] font-medium leading-relaxed text-black/60">{service.servicePageContent?.bulkText || `${service.name} starts from $${service.price.toFixed(2)} per image. Bulk ecommerce orders are priced by complexity, image volume, turnaround window, and the number of services required per file. Use the free trial to test quality before placing a paid order.`}</p>
            <Link to="/free-trial" className="mt-8 inline-flex text-[16px] lg:text-[18px] font-bold text-[var(--color-text-primary)] hover:underline">Get 3 Images Edited Free</Link>
          </div>
          <div className={cx('rounded-[28px] p-10 lg:p-16 border border-black/10 bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.05)]', tokens.motionLift)}>
            <h2 className={cx('text-[28px] lg:text-[32px] font-bold tracking-tight', typography.sectionTitleInk)}>Who this is for</h2>
            <p className="mt-4 text-[18px] lg:text-[20px] font-medium leading-relaxed text-black/60">{service.servicePageContent?.idealForText || 'This service is for ecommerce brands, Amazon sellers, product photographers, apparel teams, jewelry brands, agencies, and online operators that need consistent, publish-ready product images without building a large in-house editing team.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicePricingBox;
