import React from 'react';
import { Layers, Image as ImageIcon, Sparkles, Box } from 'lucide-react';
import { cx, layout, tokens, typography } from '../../utils/theme';

const defaultCapabilities = [
  {
    title: "Transparent Background",
    desc: "Perfectly masked edges for seamless integration into any design or composite.",
    icon: Layers
  },
  {
    title: "Custom Backgrounds",
    desc: "Replace distracting backdrops with solid white or brand-specific color palettes.",
    icon: ImageIcon
  },
  {
    title: "Shadow Management",
    desc: "Add or remove natural reflections and drop shadows for a realistic 3D feel.",
    icon: Sparkles
  },
  {
    title: "Object Removal",
    desc: "Remove dust, scratches, or unwanted props that distract from your product.",
    icon: Box
  }
];

interface ServiceCapabilitiesProps {
  service: any;
}

const ServiceCapabilities: React.FC<ServiceCapabilitiesProps> = ({ service }) => {
  // Use service capabilities if they exist, otherwise default. Map icons if needed.
  const capabilities = service?.capabilities?.map((cap: any, index: number) => ({
    ...cap,
    icon: defaultCapabilities[index % defaultCapabilities.length].icon
  })) || defaultCapabilities;

  return (
    <section className="py-12 lg:py-20 bg-white border-b border-[var(--color-border-light)]">
      <div className={cx(layout.compactShell, "px-6 lg:px-12 space-y-16")}>
        <div className="max-w-3xl space-y-2">
          <h2 className={cx('font-heading text-[var(--fluid-h2)] lg:text-[64px] font-bold tracking-[-0.04em] leading-[1.2]', typography.sectionTitleInk)}>
            Precision <br />
            <span className="text-black/40">Capabilities.</span>
          </h2>
          <p className="text-[18px] lg:text-[20px] text-[var(--color-text-secondary)] leading-relaxed max-w-2xl font-normal">
            We don't just execute instructions. We refine every pixel to ensure your brand stands out in a crowded global market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
          {capabilities.map((cap: any, i: number) => (
              <div key={i} className={cx('p-10 lg:p-12 space-y-8 group cursor-default rounded-[28px] border border-black/10 bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.05)] hover:border-black/20 hover:-translate-y-1', tokens.motionInteractive)}>
                <div className={cx('w-14 h-14 border border-black/10 rounded-[16px] flex items-center justify-center text-black/40 bg-[var(--color-bg-secondary)] group-hover:bg-[var(--color-text-primary)] group-hover:text-white', tokens.motionInteractive)}>
                  <cap.icon size={28} />
                </div>
                <div className="space-y-4">
                  <h4 className="text-[20px] lg:text-[24px] font-bold text-[var(--color-text-primary)] tracking-tight">{cap.title}</h4>
                  <p className="text-[16px] lg:text-[18px] font-medium text-black/60 leading-relaxed">{cap.desc}</p>
                </div>
              </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCapabilities;
