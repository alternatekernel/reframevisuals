import { useEffect, useState, useRef } from 'react';
import { Monitor, MessageSquare, PackageCheck, UploadCloud, Headphones, Bot } from 'lucide-react';
import ReframeCS from '../components/ReframeCS';
import { motion } from 'framer-motion';
import { cx, typography } from '../utils/theme';

const featureItems = [
  {
    icon: MessageSquare,
    title: 'Skip email loops',
    text: 'Direct support chat without inbox delays.',
    bg: 'bg-white',
    border: 'border border-black/[0.18] hover:border-black/20 hover:shadow-md shadow-sm',
    iconColor: 'text-black/80',
  },
  {
    icon: PackageCheck,
    title: 'Place and manage orders',
    text: 'Start new orders and track progress live.',
    bg: 'bg-white',
    border: 'border border-black/[0.18] hover:border-black/20 hover:shadow-md shadow-sm',
    iconColor: 'text-black/80',
  },
  {
    icon: UploadCloud,
    title: 'Upload files',
    text: 'Drag & drop images, briefs, and references.',
    bg: 'bg-white',
    border: 'border border-black/[0.18] hover:border-black/20 hover:shadow-md shadow-sm',
    iconColor: 'text-black/80',
  },
  {
    icon: Headphones,
    title: 'Support anytime',
    text: 'Instant human help for any project updates.',
    bg: 'bg-white',
    border: 'border border-black/[0.18] hover:border-black/20 hover:shadow-md shadow-sm',
    iconColor: 'text-black/80',
  },
  {
    icon: Monitor,
    title: 'Desktop app coming soon',
    text: 'Stay connected with native apps for macOS and Windows.',
    bg: 'bg-white',
    border: 'border border-black/[0.18] hover:border-black/20 hover:shadow-md shadow-sm',
    iconColor: 'text-black/80',
  },
  {
    icon: Bot,
    title: 'AI Agent Ready',
    text: 'Your AI agent can interact and manage orders.',
    bg: 'bg-white',
    border: 'border border-black/[0.18] hover:border-black/20 hover:shadow-md shadow-sm',
    iconColor: 'text-black/80',
  },
];

interface ReframeCSShowcaseProps {
  title?: string;
  subtitle?: string;
}

const ReframeCSShowcase = ({ title, subtitle }: ReframeCSShowcaseProps = {}) => {
  const [showGlow, setShowGlow] = useState(false);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Ensure floating CS bar is restored when unmounting this section
      window.dispatchEvent(
        new CustomEvent('reframe-cs-showcase-view', { detail: { inView: false } })
      );
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  return (
    <>
      {/* Hero header — matches the style of Blog, Portfolio, and other page openers */}
      <section className="px-5 sm:px-6 lg:px-12 pt-8 sm:pt-10 pb-8 sm:pb-12 bg-white relative overflow-hidden border-b border-borderSubtle">
        <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 opacity-[0.02]">
          <img src="/logo.svg" alt="Reframe Visuals" aria-hidden="true" className="w-[260px] h-[260px] sm:w-[420px] sm:h-[420px] -translate-x-1/2" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl text-center px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={cx(typography.vercelSection, "text-text-primary mb-4 text-center")}
          >
            {title ?? "Need help with your order?"}
          </motion.h2>
          <p className="text-body-sm sm:text-[18px] text-text-subtle leading-relaxed max-w-2xl mx-auto font-normal">
            {subtitle ?? "Live support preview, right on the page."}
          </p>
        </div>
      </section>

      {/* Chat showcase */}
    <section id="reframe-cs-showcase" data-section="reframe-cs-showcase" className="relative overflow-visible bg-surface px-5 pt-10 pb-12 sm:pb-14 lg:px-12 lg:pt-14 lg:pb-16 text-black">
      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-black/[0.035] blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 right-0 h-56 w-56 rounded-full bg-[var(--brand-secondary)]/16 blur-3xl" />

      <div className="relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-[1fr_3.1fr_1fr] items-center gap-8 lg:gap-10 w-full max-w-[1580px]">
        {/* Left Options (Desktop: Column 1, Mobile: Order 2) */}
        <div className="order-2 lg:order-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6 sm:gap-8 lg:gap-10">
          {featureItems.slice(0, 3).map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.98, y: 25 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
              className="flex gap-3 items-start py-2 lg:py-4"
            >
              <item.icon size={20} className={`shrink-0 mt-0.5 sm:mt-1 sm:size-5 ${item.iconColor}`} />
              <div className="flex flex-col min-w-0">
                <h3 className="text-[15px] sm:text-[17px] lg:text-[19px] font-bold tracking-tight text-text-primary leading-snug">{item.title}</h3>
                <p className="mt-1 sm:mt-1.5 text-[14px] sm:text-[14px] lg:text-[14.5px] leading-relaxed text-black/55">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Center Preview (Desktop: Column 2, Mobile: Order 1) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 45 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, margin: '-120px' }}
          onViewportEnter={() => {
            if (window.innerWidth >= 768) {
              window.dispatchEvent(
                new CustomEvent('reframe-cs-showcase-view', { detail: { inView: true } })
              );
              if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
              // Delay showcase glow by 1000ms to match widget arrival
              glowTimerRef.current = setTimeout(() => {
                setShowGlow(true);
                glowTimerRef.current = setTimeout(() => setShowGlow(false), 1400);
              }, 1000);
            }
          }}
          onViewportLeave={() => {
            if (window.innerWidth >= 768) {
              window.dispatchEvent(
                new CustomEvent('reframe-cs-showcase-view', { detail: { inView: false } })
              );
              if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
              setShowGlow(false);
            }
          }}
          transition={{ type: 'spring', stiffness: 80, damping: 16, mass: 0.95 }}
          className="order-1 lg:order-2 relative mx-auto w-full max-w-[1040px] px-1 sm:px-2 lg:px-0"
        >
          <div className={cx(
            "rounded-[16px] border bg-white shadow-[0_24px_72px_rgba(0,0,0,0.09)] overflow-hidden transition-all duration-700",
            showGlow ? "border-focus ring-4 ring-focus/20 scale-[1.015]" : "border-black/[0.18] scale-100"
          )}>
            {/* Minimal Top Bar */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-bg-soft border-b border-black/[0.20] select-none">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] block" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] block" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] block" />
              </div>
              {/* Minimal URL Text */}
              <div className="text-[12.5px] font-medium text-black/35 tracking-tight font-sans">
                https://reframevisuals.com/support
              </div>
            </div>

            {/* Chat embed */}
            <div className="overflow-hidden bg-white [&>div]:!border-none [&>div]:!shadow-none [&>div]:!rounded-none">
              <ReframeCS variant="embedded" defaultExpanded showLauncher={false} />
            </div>
          </div>
        </motion.div>

        {/* Right Options (Desktop: Column 3, Mobile: Order 3) */}
        <div className="order-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6 sm:gap-8 lg:gap-10">
          {featureItems.slice(3, 6).map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.98, y: 25 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (i + 3) * 0.05 }}
              className="flex gap-3 items-start py-2 lg:py-4"
            >
              <item.icon size={20} className={`shrink-0 mt-0.5 sm:mt-1 sm:size-5 ${item.iconColor}`} />
              <div className="flex flex-col min-w-0">
                <h3 className="text-[15px] sm:text-[17px] lg:text-[19px] font-bold tracking-tight text-text-primary leading-snug">{item.title}</h3>
                <p className="mt-1 sm:mt-1.5 text-[14px] sm:text-[14px] lg:text-[14.5px] leading-relaxed text-black/55">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
};

export default ReframeCSShowcase;


