import { Zap, Target, Award, Lightbulb, Users, TrendingUp } from 'lucide-react';
import { useContent } from '../context/ContentBase';
import { cx, layout, typography } from '../utils/theme';
import { motion } from 'framer-motion';

const ICONS = [Zap, Target, Award, Lightbulb, Users, TrendingUp];

const getCardStyles = (index: number) => {
  const styles = [
    // 0: Blue (Zap)
    {
      bg: 'bg-blue-50/50 hover:bg-blue-50/80',
      border: 'border-blue-200/50 hover:border-blue-300/80',
      iconBg: 'bg-blue-100/60 text-blue-600 group-hover:bg-blue-200/70 group-hover:text-blue-800',
    },
    // 1: Rose/Pink (Target)
    {
      bg: 'bg-rose-50/50 hover:bg-rose-50/80',
      border: 'border-rose-200/50 hover:border-rose-300/80',
      iconBg: 'bg-rose-100/60 text-rose-600 group-hover:bg-rose-200/70 group-hover:text-rose-800',
    },
    // 2: Amber/Orange (Award)
    {
      bg: 'bg-amber-50/50 hover:bg-amber-50/80',
      border: 'border-amber-200/50 hover:border-amber-300/80',
      iconBg: 'bg-amber-100/60 text-amber-600 group-hover:bg-amber-200/70 group-hover:text-amber-800',
    },
    // 3: Yellow (Lightbulb)
    {
      bg: 'bg-yellow-50/50 hover:bg-yellow-50/80',
      border: 'border-yellow-200/50 hover:border-yellow-300/80',
      iconBg: 'bg-yellow-100/60 text-yellow-600 group-hover:bg-yellow-200/70 group-hover:text-yellow-800',
    },
    // 4: Teal (Users)
    {
      bg: 'bg-teal-50/50 hover:bg-teal-50/80',
      border: 'border-teal-200/50 hover:border-teal-300/80',
      iconBg: 'bg-teal-100/60 text-teal-600 group-hover:bg-teal-200/70 group-hover:text-teal-800',
    },
    // 5: Purple/Violet (TrendingUp)
    {
      bg: 'bg-purple-50/50 hover:bg-purple-50/80',
      border: 'border-purple-200/50 hover:border-purple-300/80',
      iconBg: 'bg-purple-100/60 text-purple-600 group-hover:bg-purple-200/70 group-hover:text-purple-800',
    },
  ];
  return styles[index % styles.length];
};

const Differentiation = () => {
  const { getSectionContent } = useContent();
  const content = getSectionContent('differentiators');
  const points = ((content.points || []) as any[]);

  return (
    <section id="differentiation" className={cx("py-14 sm:py-16 lg:py-24 bg-white", layout.sectionGutter)}>
      <div className={cx(layout.compactShell, "space-y-5 sm:space-y-8 lg:space-y-14")}>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 sm:gap-8 lg:gap-24 items-start lg:items-center">
          {/* Left: Content */}
          <div>
            <h2 className={cx(typography.displayLg, "text-[var(--color-text-primary)] mb-3 sm:mb-4")}>
              {content.heading || 'Where standard services fail.'} <br />
              <span className="text-black/40">{content.subheading || 'How we handle it differently.'}</span>
            </h2>

            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <p className="max-w-[34ch] text-[15px] sm:max-w-none sm:text-[16px] text-black/60 leading-[1.45] sm:leading-relaxed">
                Automated tools drop <span className="font-bold text-black">lace, glass, hair, and transparent edges</span>. Offshore services race on price and lose on consistency. Enterprise studios charge monthly minimums most catalogs can't fill. We trace complex edges by hand, match your style guide, and price per image.
              </p>
              <p className="hidden sm:block text-[14px] sm:text-[16px] text-black/70 leading-[1.45] sm:leading-relaxed border-l-2 border-black/20 pl-3 sm:pl-5">
                <span className="font-bold">Pen Tool tracing on every path.</span> Guaranteed turnaround windows. No contracts. Send 3 images free before your first paid order.
              </p>
              <div className="relative hidden sm:block">
                {/* Decorative Logo */}
                <div className="hidden sm:block absolute -top-12 -left-20 w-48 h-48 pointer-events-none opacity-[0.05] z-0">
                  <img src="/logo.svg" alt="Reframe Strategic Differentiation Element" className="w-full h-full object-contain -rotate-12" />
                </div>

                <p className="relative z-10 text-[16px] sm:text-[18px] font-bold text-black">
                  Per-image pricing from $0.39, with no contract and no minimum order.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Redesigned transformation cards */}
          <div className="rounded-[28px] border border-black/[0.18] bg-[#FAFAFA] p-2.5 shadow-[0_18px_60px_-48px_rgba(0,0,0,0.5)] sm:p-4">
            <div className="grid gap-2.5 sm:gap-3">
              {points.map((point: any, i: number) => {
                const Icon = ICONS[i] || Target;
                const cardStyles = getCardStyles(i);
                return (
                  <motion.article
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={`group grid grid-cols-[auto_1fr] gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 sm:grid-cols-[auto_1fr] sm:items-start sm:p-5 ${cardStyles.bg} ${cardStyles.border}`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-black/[0.12] transition-colors sm:h-11 sm:w-11 ${cardStyles.iconBg}`}>
                      <Icon size={16} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold leading-snug text-black/35 line-through sm:text-[15px]">{point.old}</p>
                      <p className="mt-1 text-[14px] font-bold leading-snug tracking-[-0.015em] text-[var(--color-text-primary)] sm:text-[18px]">{point.new}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Differentiation;
