import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HelpCircle, Plus, Minus, ArrowRight } from 'lucide-react';
import { cx, layout, tokens, typography } from '../../utils/theme';

const DEFAULT_FAQS = [
  {
    q: "What file formats do you deliver?",
    a: "We deliver in all industry-standard formats including high-res JPG, transparent PNG, layered PSD, and TIFF, optimized for your specific platform."
  },
  {
    q: "How fast is the turnaround?",
    a: "Our standard delivery is within 24 hours. For urgent projects, we offer express delivery within 12 hours depending on volume."
  },
  {
    q: "Do you offer bulk discounts?",
    a: "Yes, for high-volume enterprise projects (500+ images), we offer custom pricing tiers. Contact our sales team for a formal quote."
  },
  {
    q: "Can I request revisions?",
    a: "Absolutely. Customer satisfaction is our priority. We offer unlimited minor revisions until the output perfectly matches your brand guidelines."
  }
];

interface ServiceFaqProps {
  service: any;
}

const ServiceFaq: React.FC<ServiceFaqProps> = ({ service }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = service?.faqs || DEFAULT_FAQS;

  return (
    <section className="py-12 lg:py-20 bg-white">
      <div className={cx(layout.compactShell, "px-6 lg:px-12")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          {/* Left column */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-black/40">
                <HelpCircle size={20} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Support</span>
              </div>
              <h2 className={cx('font-heading text-[var(--fluid-h2)] lg:text-[64px] font-bold tracking-[-0.04em] leading-[1.2]', typography.sectionTitleInk)}>
                Common <br />
                <span className="text-black/40">Inquiries.</span>
              </h2>
              <p className="text-[18px] lg:text-[20px] text-[var(--color-text-secondary)] leading-relaxed font-normal">
                Everything you need to know about our production process and delivery standards.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/contact"
                className="group inline-flex h-[50px] lg:h-[56px] items-center gap-3 rounded-full border border-black/[0.18] bg-white px-8 text-[15px] lg:text-[16px] font-bold text-black transition-colors hover:bg-black/5"
              >
                Contact the team
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 transition-transform group-hover:translate-x-1">
                  <ArrowRight size={14} strokeWidth={3} />
                </div>
              </Link>
            </div>
          </div>

          {/* Right column — FAQ accordion */}
          <div className="lg:col-span-7 space-y-3">
            {faqs.map((faq: any, i: number) => (
              <div key={i} className={cx('overflow-hidden bg-[var(--color-bg-secondary)]/50 rounded-2xl border border-black/[0.12]', tokens.motionInteractive)}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-7 text-left hover:bg-white transition-colors"
                >
                  <span className="text-[20px] lg:text-[22px] font-bold text-[var(--color-text-primary)] tracking-tight">{faq.q}</span>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-black/40">
                    {openFaq === i ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="px-7 pb-8 text-[16px] lg:text-[18px] font-medium text-black/60 leading-relaxed max-w-xl">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceFaq;
