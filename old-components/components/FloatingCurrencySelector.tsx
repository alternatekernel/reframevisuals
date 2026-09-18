import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useCurrency, type SupportedCurrency } from '../context/CurrencyContext';
import { cx } from '../utils/theme';
import { useHeroSectionVisibility } from '../hooks/useHeroSectionVisibility';

const CURRENCY_OPTIONS: SupportedCurrency[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'AED'];

const CURRENCY_FLAGS: Record<SupportedCurrency, { src: string; alt: string }> = {
  USD: { src: 'https://flagcdn.com/w20/us.png', alt: 'United States flag' },
  EUR: { src: 'https://flagcdn.com/w20/eu.png', alt: 'European Union flag' },
  GBP: { src: 'https://flagcdn.com/w20/gb.png', alt: 'United Kingdom flag' },
  INR: { src: 'https://flagcdn.com/w20/in.png', alt: 'India flag' },
  CAD: { src: 'https://flagcdn.com/w20/ca.png', alt: 'Canada flag' },
  AUD: { src: 'https://flagcdn.com/w20/au.png', alt: 'Australia flag' },
  AED: { src: 'https://flagcdn.com/w20/ae.png', alt: 'United Arab Emirates flag' },
};

const FloatingCurrencySelector: React.FC = () => {
  const { currency, setCurrencyManual } = useCurrency();
  const location = useLocation();
  const isHeroVisible = useHeroSectionVisibility();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/pricing' || isHeroVisible) {
      setOpen(false);
    }
  }, [location.pathname, isHeroVisible]);

  if (location.pathname !== '/pricing' || isHeroVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-[320] hidden sm:block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="relative min-h-11 rounded-full border border-black/10 bg-white pl-3 pr-9 text-[12px] font-semibold text-[#171717] hover:bg-black/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
        aria-label="Select currency"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <img
            src={CURRENCY_FLAGS[currency].src}
            alt={CURRENCY_FLAGS[currency].alt}
            className="w-4 h-4 rounded-full object-cover border border-black/10"
            loading="lazy"
          />
          <span>{currency}</span>
        </span>
        <ChevronDown
          size={14}
          className={cx(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/55 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-0 mb-2 w-36 overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.14)] backdrop-blur-xl z-[320]"
            role="listbox"
            aria-label="Currency options"
          >
            {CURRENCY_OPTIONS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setCurrencyManual(code);
                  setOpen(false);
                }}
                className={cx(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors",
                  currency === code
                    ? "bg-[#171717] text-white"
                    : "text-[#171717] hover:bg-black/[0.04]"
                )}
                role="option"
                aria-selected={currency === code}
              >
                <span className="inline-flex items-center gap-2">
                  <img
                    src={CURRENCY_FLAGS[code].src}
                    alt={CURRENCY_FLAGS[code].alt}
                    className="w-4 h-4 rounded-full object-cover border border-black/10"
                    loading="lazy"
                  />
                  <span>{code}</span>
                </span>
                {currency === code ? <span className="text-[10px]">Active</span> : null}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingCurrencySelector;
