import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText, Clock, RotateCcw, CreditCard } from 'lucide-react';
import { cx, layout, typography } from '../../utils/theme';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  icon: any;
}

const FAQ_CARD_THEMES = [
  {
    shell: 'border-black/[0.18] bg-[#FAFAFA] hover:border-black/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
    openShell: 'border-black/[0.18] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.11)]',
    icon: 'bg-white text-black/60 border-black/[0.18] shadow-sm',
    iconOpen: 'bg-black text-white border-black shadow-md',
    label: 'text-black/50',
    chevron: 'bg-white text-black/50 shadow-sm border border-black/[0.12]',
    chevronOpen: 'bg-black text-white shadow-md',
    answerBorder: 'border-black/[0.12]',
  },
];

const PricingFaq: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      category: 'File Formats',
      icon: FileText,
      question: 'What file formats do you accept for editing, and what formats do you deliver?',
      answer: 'We accept almost all image formats including RAW camera files (CR2, NEF, ARW, DNG), high-resolution TIFF, layered PSD, PNG, JPG, and WebP. For output delivery, we typically provide layered PSD (with paths or transparent layers), web-optimized high-quality transparent PNG, flat JPG, or WebP depending on your exact marketplace or theme requirements.',
    },
    {
      category: 'Turnaround Times',
      icon: Clock,
      question: 'How do turnaround times work for small vs. large catalog batches?',
      answer: 'Our workflow supports 12h, 24h, 48h, and 72h turnaround speeds selected at checkout. Standard volumes (under 500 images) are guaranteed within the selected time window. For batches over 1,000 images, our team coordinates a staggered delivery schedule with daily batches.',
    },
    {
      category: 'Revisions',
      icon: RotateCcw,
      question: 'How do I request revisions, and what is your turnaround on corrections?',
      answer: 'You can request revisions within 14 days of image delivery. Simply open your dashboard, navigate to the delivered batch, select the image requiring correction, and submit your guidelines. Revisions are free of charge and processed with high priority, matching or beating your original order turnaround speed.',
    },
    {
      category: 'Payments & Billing',
      icon: CreditCard,
      question: 'What payment methods do you accept, and do you support invoicing?',
      answer: 'We accept all major credit cards, Apple Pay, Google Pay, and bank wire transfers (ACH/SEPA). Payment is processed per batch upon order placement. For enterprise-level accounts or teams managing consistent weekly volume, we support consolidated monthly billing with 15-day or 30-day payment terms.',
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-12 lg:py-16 bg-white border-t border-[#f0f0f0] relative overflow-hidden">
      <div className={cx(layout.compactShell, 'relative z-10')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className={cx(typography.vercelMono, 'mb-4 text-black/50')}>
            FAQ
          </div>
          <h2 className={cx(typography.vercelSection, typography.sectionTitleInk, 'mb-6')}>
            Common questions<br />
            <span className="text-black/45">about pricing and policies.</span>
          </h2>
          <p className="text-[16px] text-[var(--color-text-secondary)] leading-relaxed">
            Answers on file formats, turnaround times, revisions, and payment.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto rounded-3xl border border-black/[0.18] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-6">
          <div className="flex flex-col gap-3">
            {faqItems.map((item, i) => {
              const Icon = item.icon;
              const isOpen = activeFaq === i;
              const theme = FAQ_CARD_THEMES[i % FAQ_CARD_THEMES.length];

              return (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cx(
                    'overflow-hidden rounded-2xl border transition-all duration-300',
                    isOpen ? theme.openShell : theme.shell
                  )}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 sm:gap-4 px-4 py-4 sm:px-5 sm:py-5 text-left"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={cx(
                        'flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300',
                        isOpen ? theme.iconOpen : theme.icon
                      )}>
                        <Icon size={15} className="sm:size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cx('mb-1 text-[11px] font-semibold uppercase tracking-widest', theme.label)}>
                          {item.category}
                        </span>
                        <span className="font-heading text-[15px] font-bold leading-snug tracking-tight text-black sm:text-[16px]">
                          {item.question}
                        </span>
                      </div>
                    </div>
                    <motion.span
                      className={cx(
                        'flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                        isOpen ? theme.chevronOpen : theme.chevron
                      )}
                      animate={{ rotate: isOpen ? 180 : 0 }}
                    >
                      <ChevronDown size={13} className="sm:size-[14px]" />
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
                        <div className={cx('border-t px-4 pb-4 pt-4 pl-[52px] sm:px-5 sm:pb-5 sm:pl-[60px]', theme.answerBorder)}>
                          <p className="text-[14px] sm:text-[15px] font-medium leading-relaxed text-black/60">{item.answer}</p>
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

export default PricingFaq;
