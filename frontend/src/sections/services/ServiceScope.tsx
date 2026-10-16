import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cx, layout, tokens, typography } from '../../utils/theme';

interface ServiceScopeProps {
  service: {
    id: string;
    name: string;
    categoryId: string;
    includes: string[];
  };
}

const ServiceScope: React.FC<ServiceScopeProps> = ({ service }) => {
  // Determine exclusions based on category or service ID
  const getExclusions = (id: string, categoryId: string): string[] => {
    switch (categoryId) {
      case 'foundation':
        if (id === 'ghost-mannequin') {
          return [
            'Fabric pattern swaps or textures',
            'Full color change / product recoloring',
            'Surface blemish & model skin retouching',
            'Custom drop shadows & reflections (available as add-ons)',
          ];
        }
        return [
          'High-end surface scratch & dust retouching',
          'Model skin clearing or stray hair removal',
          'Invisible ghost mannequin neck-joins',
          'Adding reflections or complex cast shadows',
        ];
      case 'enhancement':
        if (id === 'shadow-creation') {
          return [
            'Background removal & deep etching',
            'Product scratch, dust, or wrinkle cleanup',
            'Recoloring or changing product textures',
          ];
        }
        return [
          'Original background extraction (unless combined)',
          'Skin, clothing, or model retouching',
          'Adding 3D mockups or heavy CGI environment designs',
        ];
      case 'retouch':
        return [
          'Ghost mannequin assembly / invisible neck joins',
          'Vector redraws or logo conversions',
          'Replacing fabric patterns & graphics',
          'Complex clipping paths or component masks',
        ];
      case 'advanced':
      case 'ai-driven':
        return [
          'Physical studio styling or model booking',
          'Manual clipping paths on unrefined raw images',
          'Unlimited stock photography sourcing',
        ];
      default:
        return [
          'Sourcing third-party model models or products',
          'Major 3D CAD modeling or mesh edits',
          'Separate background extraction steps',
        ];
    }
  };

  const inclusions = service.includes && service.includes.length > 0
    ? service.includes
    : ['Professional high-res processing', 'Manual edge adjustments', 'Color check & exposure correction'];

  const exclusions = service.servicePageContent?.excludes?.length
    ? service.servicePageContent.excludes
    : getExclusions(service.id, service.categoryId);

  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        <div className="mb-12 text-center md:text-left max-w-3xl">
          <h2 className={cx('font-heading text-[32px] sm:text-[42px] lg:text-[48px] font-bold tracking-[-0.04em] leading-[1.05]', typography.sectionTitleInk)}>
            Service Scope <span className="text-black/40">& Policies.</span>
          </h2>
          <p className="text-[16px] lg:text-[18px] text-[var(--color-text-secondary)] mt-4 font-medium leading-relaxed">
            Understanding what is covered in your order for {service.name}.
          </p>
        </div>

        <div className="grid gap-8 lg:gap-12 md:grid-cols-3">
          {/* Column 1: What's Included */}
          <div className="flex flex-col bg-green-50/30 border border-green-500/10 rounded-[28px] p-10 lg:p-12 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6 text-green-700">
              <CheckCircle2 size={22} />
              <h3 className="text-[16px] font-bold uppercase tracking-wider">What is Included</h3>
            </div>
            <ul className="space-y-4 mt-1 flex-1">
              {inclusions.map((item) => (
                <li key={item} className="flex gap-3 text-[16px] leading-relaxed text-black/70 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: What's Not Included */}
          <div className="flex flex-col bg-red-50/30 border border-red-500/10 rounded-[28px] p-10 lg:p-12 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6 text-red-700">
              <XCircle size={22} />
              <h3 className="text-[16px] font-bold uppercase tracking-wider">Out of Scope</h3>
            </div>
            <ul className="space-y-4 mt-1 flex-1">
              {exclusions.map((item) => (
                <li key={item} className="flex gap-3 text-[16px] leading-relaxed text-black/70 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Revisions & SLA */}
          <div className="flex flex-col bg-blue-50/30 border border-blue-500/10 rounded-[28px] p-10 lg:p-12 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6 text-blue-700">
              <RefreshCw size={22} />
              <h3 className="text-[16px] font-bold uppercase tracking-wider">How Revisions Work</h3>
            </div>
            <div className="space-y-5 text-[16px] leading-relaxed text-black/70 flex-1 font-medium">
              <div>
                <p className="font-bold text-[var(--color-text-primary)]">14-Day Window</p>
                <p className="text-black/60 mt-1">Submit adjustment requests within 2 weeks of raw file delivery.</p>
              </div>
              <div className="border-t border-black/5 pt-4">
                <p className="font-bold text-[var(--color-text-primary)]">Dashboard Markup</p>
                <p className="text-black/60 mt-1">Open your project dashboard, select the image, and mark revisions directly.</p>
              </div>
              <div className="border-t border-black/5 pt-4">
                <p className="font-bold text-[var(--color-text-primary)]">SLA Matching</p>
                <p className="text-black/60 mt-1">Adjustments are returned matching the speed of your original order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceScope;
