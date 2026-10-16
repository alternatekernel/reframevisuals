import React from 'react';
import { Link } from 'react-router-dom';
import { cx, layout, typography } from '../../utils/theme';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { INDUSTRY_PAGES, GEO_PAGES } from '../../data/expansionPages';

interface ServiceRelatedGuidesProps {
  service: any;
}

const ServiceRelatedGuides: React.FC<ServiceRelatedGuidesProps> = ({ service }) => {
  const BLOG_POSTS = useBlogPosts();
  const kw = (service.keywords || []).map((k: string) => k.toLowerCase());

  const guides = BLOG_POSTS.filter((p) =>
    kw.some((k: string) => p.slug.includes(k) || (p.tags || []).some((t: string) => t.toLowerCase().includes(k)))
  ).slice(0, 3);

  const industryLinks = INDUSTRY_PAGES.filter((p) =>
    kw.some((k: string) => p.slug.includes(k) || p.title.toLowerCase().includes(k))
  );
  const geoLinks = GEO_PAGES.filter((p) =>
    kw.some((k: string) => p.slug.includes(k) || p.title.toLowerCase().includes(k))
  );
  const combinedPlatforms = [...industryLinks, ...geoLinks].slice(0, 5);

  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          
          {/* Column 1: Decision Guides */}
          <div className="space-y-6">
            <h2 className={cx('text-[24px] lg:text-[28px] font-bold tracking-tight', typography.sectionTitleInk)}>Related Decision Guides</h2>
            <div className="flex flex-col gap-4">
              <Link to={`/services/${service.id}/best-for-ecommerce`} className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">Best {service.name} for ecommerce</Link>
              <Link to={`/services/${service.id}/pricing-guide`} className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">{service.name} pricing guide</Link>
              <Link to={`/services/${service.id}/turnaround-quality`} className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">{service.name} turnaround + quality standards</Link>
              <Link to="/compare/in-house-vs-outsourcing" className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">In-house vs outsourced editing</Link>
              <Link to="/pricing" className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">View pricing</Link>
              <Link to="/free-trial" className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">Start free trial</Link>
              <Link to="/book-meeting" className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">Book a meeting</Link>
            </div>
          </div>

          {/* Expert Guides */}
          {guides.length > 0 && (
            <div className="space-y-6">
              <h2 className={cx('text-[24px] lg:text-[28px] font-bold tracking-tight', typography.sectionTitleInk)}>Expert Guides</h2>
              <div className="flex flex-col gap-4">
                {guides.map((g) => (
                  <Link key={g.slug} to={`/blog/${g.slug}`} className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">{g.title}</Link>
                ))}
              </div>
            </div>
          )}

          {/* Platforms & Industries */}
          {combinedPlatforms.length > 0 && (
            <div className="space-y-6">
              <h2 className={cx('text-[24px] lg:text-[28px] font-bold tracking-tight', typography.sectionTitleInk)}>Platforms & Industries</h2>
              <div className="flex flex-col gap-4">
                {combinedPlatforms.map((g) => (
                  <Link key={g.slug} to={`/${g.slug}`} className="text-[16px] lg:text-[18px] font-medium text-[var(--color-text-primary)] hover:underline">{g.title}</Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default ServiceRelatedGuides;
