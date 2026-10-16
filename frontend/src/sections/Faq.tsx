import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Image as ImageIcon, Cpu, Layers, Clock, CreditCard, RotateCcw, MessageCircle, HelpCircle } from 'lucide-react';
import { useContent } from '../context/ContentBase';
import { cx, layout, typography } from '../utils/theme';

const FAQ_CARD_THEMES = [
  {
    shell: 'border-black/10 bg-[#FAFAFA] hover:border-black/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]',
    openShell: 'border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
    icon: 'bg-white text-black/60 border-black/10 shadow-sm',
    iconOpen: 'bg-black text-white border-black shadow-md',
    label: 'text-black/50',
    chevron: 'bg-white text-black/50 shadow-sm border border-black/5',
    chevronOpen: 'bg-black text-white shadow-md',
    answerBorder: 'border-black/5',
  },
];

const ICON_MAP: Record<string, any> = {
  'Image': ImageIcon,
  'Cpu': Cpu,
  'Layers': Layers,
  'Clock': Clock,
  'CreditCard': CreditCard,
  'RotateCcw': RotateCcw,
  'MessageCircle': MessageCircle,
};

const Faq: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { getSectionContent } = useContent();
  const content = getSectionContent('faq');
  const faqItems = (content.landing || []) as any[];

  return (
    <section id="faq" className="px-6 lg:px-12 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-16 bg-white relative overflow-hidden scroll-mt-nav">
      <div className={cx(layout.compactShell, 'relative z-10')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center max-w-2xl mx-auto mb-16"
        >

          <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, 'mb-6')}>
            {content.heading || 'Common'}<br />
            <span className="text-black/45">{content.subheading || 'Questions.'}</span>
          </h2>
          <p className="text-[16px] text-[var(--color-text-secondary)] leading-relaxed">
            {content.description || 'Everything you need to know for seamless production.'}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto rounded-3xl border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="flex flex-col gap-3">
            {faqItems.map((item, i) => {
              const Icon = ICON_MAP[item.icon] || HelpCircle;
              const isOpen = activeFaq === i;
              const theme = FAQ_CARD_THEMES[i % FAQ_CARD_THEMES.length];

              return (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: i * 0.035, duration: 0.25 }}
                  className={cx(
                    'overflow-hidden rounded-2xl border transition-all duration-300',
                    isOpen ? theme.openShell : theme.shell
                  )}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={cx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 sm:h-9 sm:w-9',
                        isOpen ? theme.iconOpen : theme.icon
                      )}>
                        <Icon size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className={cx('mb-1 text-[10px] font-black uppercase tracking-widest', theme.label)}>
                          {item.category || 'GENERAL'}
                        </span>
                        <span className="font-heading text-[14px] font-bold leading-snug tracking-tight text-black sm:text-[16px]">
                          {item.question}
                        </span>
                      </div>
                    </div>
                    <motion.span
                      className={cx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all sm:h-7 sm:w-7',
                        isOpen ? theme.chevronOpen : theme.chevron
                      )}
                      animate={{ rotate: isOpen ? 180 : 0 }}
                    >
                      <ChevronDown size={13} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        <div className={cx('border-t px-4 pb-4 pt-3 pl-[55px] sm:px-5 sm:pb-5 sm:pt-4 sm:pl-[68px]', theme.answerBorder)}>
                          <p className="text-[14px] font-medium leading-relaxed text-black/60">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faq;

