import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, List, Hash, ChevronDown } from 'lucide-react';
import { cx, tokens } from '../utils/theme';
import { SERVICES, sortServicesByDisplayOrder } from '../data/services';
import { isExcludedService } from '../context/ServicesContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';
import { motion } from 'framer-motion';

const pastelStyles = [
  { 
    hoverClass: 'hover:bg-red-50/10',
    tagClass: 'bg-red-50 text-black/60 border-red-100'
  },
  { 
    hoverClass: 'hover:bg-orange-50/10',
    tagClass: 'bg-orange-50 text-black/60 border-orange-100'
  },
  { 
    hoverClass: 'hover:bg-emerald-50/10',
    tagClass: 'bg-emerald-50 text-black/60 border-emerald-100'
  },
  { 
    hoverClass: 'hover:bg-blue-50/10',
    tagClass: 'bg-blue-50 text-black/60 border-blue-100'
  },
  { 
    hoverClass: 'hover:bg-purple-50/10',
    tagClass: 'bg-purple-50 text-black/60 border-purple-100'
  }
];

const ServiceTable: React.FC = () => {
  const navigate = useNavigate();
  const { currency, convertFromUsd } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const orderedServices = useMemo(() => {
    return sortServicesByDisplayOrder(SERVICES.filter(s => !s.hidden && !isExcludedService(s)));
  }, []);

  const firstThreeServices = useMemo(() => orderedServices.slice(0, 3), [orderedServices]);
  const remainingServices = useMemo(() => orderedServices.slice(3), [orderedServices]);

  const handleToggleExpand = () => {
    if (isExpanded) {
      // Scroll the container back into viewport smoothly so the user doesn't lose context
      const element = tableRef.current;
      if (element) {
        const yOffset = -90; // Adjust for fixed/sticky navbar height
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative w-full">

      <div className="max-w-5xl mx-auto px-4 pt-3 pb-8 sm:pt-4 sm:pb-12 lg:pt-4 lg:pb-12">
        {/* Turnaround Pill Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8 mt-2">
          {[
            { time: '12h', label: 'Express' },
            { time: '24h', label: 'Standard' },
            { time: '48h', label: 'Relaxed' },
            { time: '72h', label: 'Economy' },
          ].map(({ time, label }) => (
            <div
              key={label}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
                label === 'Standard'
                  ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white'
                  : 'border-black/[0.18] bg-white text-[var(--color-text-primary)]'
              }`}
            >
              <span className="text-[14px] font-bold">{time}</span>
              <span className={`text-[12px] font-medium ${label === 'Standard' ? 'text-white/65' : 'text-black/45'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

      {/* Spreadsheet Container */}

      <div
        ref={tableRef}
        className={cx('relative w-full overflow-hidden', tokens.surfacePanel)}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(23,23,23,0.18),transparent)]" />
        <div className="w-full">
          <div className="w-full">
            {/* Header Row */}
            <div className="grid grid-cols-[1fr_120px] sm:grid-cols-[25%_50%_25%] w-full items-stretch bg-[var(--color-bg-secondary)] border-b border-neutral-300/80 text-[12px] font-heading font-semibold text-neutral-600 uppercase tracking-[0.18em] select-none h-11">
              <div className="flex items-center gap-1.5 border-r border-neutral-300/60 px-6">
                <FileText size={13} className="text-neutral-400 shrink-0" />
                <span>Service</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 border-r border-neutral-300/60 px-6">
                <List size={13} className="text-neutral-400 shrink-0" />
                <span>Included Features</span>
              </div>
              <div className="flex items-center pl-4 pr-6 whitespace-nowrap">
                <div className="flex-1 flex items-center justify-center gap-1.5">
                  <Hash size={13} className="text-neutral-400 shrink-0" />
                  <span className="whitespace-nowrap">Starting price</span>
                </div>
                <div className="hidden sm:block w-8 ml-3 shrink-0" />
              </div>
            </div>

            {/* Table 1: Always Visible Rows */}
            <div>
              {firstThreeServices.map((svc, index) => {
                const Icon = svc.icon;
                const style = pastelStyles[index % pastelStyles.length];

                return (
                  <div
                    key={svc.id}
                    onClick={() => navigate(`/services/${svc.id}`)}
                    className={cx(
                      "group grid grid-cols-[1fr_120px] sm:grid-cols-[25%_50%_25%] w-full items-stretch cursor-pointer text-[16px] transition-all duration-300 ease-in-out min-h-[64px] py-3 sm:py-0 sm:h-[64px]",
                      index === 2 ? (isExpanded ? "border-b border-black/[0.18]" : "") : "border-b border-black/[0.18]",
                      style.hoverClass
                    )}
                  >
                    {/* Column 1: Service Name */}
                    <div className="flex items-center gap-3 border-r border-neutral-200/70 px-6 min-w-0">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400 group-hover:text-neutral-800 group-hover:scale-105 transition-all duration-200">
                        {Icon && <Icon size={16} className="shrink-0" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-heading text-[15px] font-semibold text-neutral-900 group-hover:text-black transition-colors leading-tight">
                          {svc.name}
                        </span>
                        {/* Mobile-only features display */}
                        <div className="sm:hidden mt-1 text-[12px] text-neutral-500 leading-normal">
                          {svc.includes.join(' · ')}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Included Features */}
                    <div className="hidden sm:flex items-center gap-1.5 border-r border-black/[0.18] px-5 min-w-0 overflow-hidden whitespace-nowrap">
                      {svc.includes.slice(0, 2).map((inc, i) => (
                        <span
                          key={i}
                          className={cx(
                            "inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] font-sans shrink-0 transition-colors duration-200",
                            pastelStyles[(index + i) % pastelStyles.length].tagClass
                          )}
                        >
                          {inc}
                        </span>
                      ))}
                      {svc.includes.length > 2 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] text-black/40 font-sans shrink-0">
                          + more
                        </span>
                      )}
                    </div>

                    {/* Column 3: Price & Action */}
                    <div className="flex items-center min-w-0 py-5 pl-4 pr-6">
                      <div className="flex-1 flex items-center justify-center">
                        <span className="font-heading text-[16px] font-semibold text-neutral-900 tabular-nums tracking-tight whitespace-nowrap group-hover:scale-105 transition-transform duration-300">
                          {formatCurrency(convertFromUsd(svc.price), currency)}
                        </span>
                      </div>
                      
                      <div className="hidden sm:flex items-center justify-center h-8 w-8 ml-3 rounded-full bg-[var(--color-bg-secondary)] border border-neutral-300 text-neutral-500 group-hover:bg-neutral-900 group-hover:border-neutral-900 group-hover:text-white transition-all duration-200 shrink-0">
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table 2: Expandable (Remaining Rows) */}
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
              transition={{
                duration: isExpanded ? 0.65 : 1.1, // Slower closing animation (1.1s)
                ease: [0.16, 1, 0.3, 1]
              }}
              className="overflow-hidden"
            >
              {remainingServices.map((svc, index) => {
                const actualIndex = index + 3;
                const Icon = svc.icon;
                const style = pastelStyles[actualIndex % pastelStyles.length];

                return (
                  <div
                    key={svc.id}
                    onClick={() => navigate(`/services/${svc.id}`)}
                    className={cx(
                      "group grid grid-cols-[1fr_120px] sm:grid-cols-[25%_50%_25%] w-full items-stretch cursor-pointer text-[16px] transition-all duration-300 ease-in-out min-h-[64px] py-3 sm:py-0 sm:h-[64px] border-b border-black/[0.18] last:border-b-0",
                      style.hoverClass
                    )}
                  >
                    {/* Column 1: Service Name */}
                    <div className="flex items-center gap-3 border-r border-neutral-200/70 px-6 min-w-0">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center text-neutral-400 group-hover:text-neutral-800 group-hover:scale-105 transition-all duration-200">
                        {Icon && <Icon size={16} className="shrink-0" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-heading text-[15px] font-semibold text-neutral-900 group-hover:text-black transition-colors leading-tight">
                          {svc.name}
                        </span>
                        {/* Mobile-only features display */}
                        <div className="sm:hidden mt-1 text-[12px] text-neutral-500 leading-normal">
                          {svc.includes.join(' · ')}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Included Features */}
                    <div className="hidden sm:flex items-center gap-1.5 border-r border-black/[0.18] px-5 min-w-0 overflow-hidden whitespace-nowrap">
                      {svc.includes.slice(0, 2).map((inc, i) => (
                        <span
                          key={i}
                          className={cx(
                            "inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] font-sans shrink-0 transition-colors duration-200",
                            pastelStyles[(actualIndex + i) % pastelStyles.length].tagClass
                          )}
                        >
                          {inc}
                        </span>
                      ))}
                      {svc.includes.length > 2 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] text-black/40 font-sans shrink-0">
                          + more
                        </span>
                      )}
                    </div>

                    {/* Column 3: Price & Action */}
                    <div className="flex items-center min-w-0 py-5 pl-4 pr-6">
                      <div className="flex-1 flex items-center justify-center">
                        <span className="font-heading text-[16px] font-semibold text-neutral-900 tabular-nums tracking-tight whitespace-nowrap group-hover:scale-105 transition-transform duration-300">
                          {formatCurrency(convertFromUsd(svc.price), currency)}
                        </span>
                      </div>
                      
                      <div className="hidden sm:flex items-center justify-center h-8 w-8 ml-3 rounded-full bg-[var(--color-bg-secondary)] border border-neutral-300 text-neutral-500 group-hover:bg-neutral-900 group-hover:border-neutral-900 group-hover:text-white transition-all duration-200 shrink-0">
                        <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
        <button
          onClick={handleToggleExpand}
          className="w-full py-4 bg-[var(--color-bg-secondary)] hover:bg-black/5 border-t border-black/20 text-[13px] font-heading font-bold text-black/50 hover:text-black flex items-center justify-center gap-2 transition-all duration-300 select-none"
        >
          <span>{isExpanded ? 'Show less services' : 'Show all services'}</span>
          <ChevronDown size={14} className={cx("transition-transform duration-300", isExpanded && "rotate-180")} />
        </button>
      </div>
      </div>
    </div>
  );
};

export default React.memo(ServiceTable);
