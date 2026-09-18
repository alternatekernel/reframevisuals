import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx, tokens, typography } from '../../utils/theme';
import { Activity } from 'lucide-react';
import { useContent } from '../../context/ContentBase';
import { ButtonWithIcon } from '../ui/button-with-icon';
import { useCurrency } from '../../context/CurrencyContext';
import { formatCurrency } from '../../utils/currency';

interface BundleCardProps {
  b: {
    name: string;
    price: number | null;
    services: string[];
    savings?: string;
    highlight?: boolean;
  };
  i: number;
}

const BundleCard: React.FC<BundleCardProps> = ({ b, i }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isUserAuthenticated } = useContent();
  const navigate = useNavigate();
  const { currency, convertFromUsd } = useCurrency();
  const isHighlighted = b.highlight ?? (i === 1);
  const standardTone = {
    shell: "bg-white border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.04)]",
    title: "text-black",
    priceSub: "text-black/40",
    dot: "bg-black/20",
    text: "text-black/65 group-hover/item:text-black",
    chip: "bg-black/[0.04] text-black/60 border border-black/10",
    button: "white",
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cx(
        "group relative flex flex-col p-1 transition-all duration-300 h-full",
        tokens.radiusCard,
        isHighlighted ? "z-20" : "z-10"
      )}
    >
      {/* 1. OUTER SHELL */}
      <div className={cx(
        "absolute inset-0 overflow-hidden border transition-all duration-300",
        tokens.radiusCard,
        isHighlighted ? "bg-[#1F1F1F]" : standardTone.shell,
        isHovered && !isHighlighted ? "shadow-[0_18px_40px_rgba(0,0,0,0.07)] border-black/10" : ""
      )}>
        {!isHighlighted && <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />}
      </div>

      {/* 2. INNER CONTENT AREA */}
      <div className={cx(
        "relative flex-1 flex flex-col p-6 lg:p-8 overflow-hidden transition-all duration-500",
        tokens.radiusCard,
        isHighlighted ? "bg-transparent text-white" : "bg-transparent"
      )}>
        
        {/* Pricing Identity */}
        <div className="space-y-2 mb-6 lg:mb-8">
          <h4 className={cx(
            typography.label,
            isHighlighted ? "text-white" : standardTone.title
          )}>
            {b.name}
          </h4>
          <div className="space-y-1">
            {b.price !== null && (
              <p className={cx(
                "text-[11px] font-black uppercase tracking-[0.18em]",
                isHighlighted ? "text-white/45" : standardTone.priceSub
              )}>
                Starting from
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <span className={cx(
                typography.price,
                "text-[30px] leading-none",
                isHighlighted ? "text-white" : "text-black"
              )}>
                {b.price !== null ? formatCurrency(convertFromUsd(b.price), currency) : 'Custom'}
              </span>
              <span className={cx(
                "text-[16px] font-medium",
                isHighlighted ? "text-white/50" : standardTone.priceSub
              )}>
                /image
              </span>
            </div>
          </div>
        </div>

        {/* Feature Matrix */}
        <div className="flex-1 space-y-3 mb-8 lg:mb-10">
          {b.services?.map((s, si) => (
            <div 
              key={si} 
              className="flex items-center gap-3 group/item"
            >
              <div className={cx(
                "w-1.5 h-1.5 rounded-full transition-all duration-300 shrink-0",
                isHighlighted ? "bg-white/30" : standardTone.dot,
                isHovered && !isHighlighted ? "bg-black/50" : ""
              )} />
              <span className={cx(
                "text-[16px] font-medium transition-colors",
                isHighlighted ? "text-white/70 group-hover/item:text-white" : standardTone.text
              )}>
                {s}
              </span>
            </div>
          ))}
          {b.savings && (
            <div className="pt-2">
              <div className={cx(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-black uppercase tracking-wider",
                  isHighlighted ? "bg-white/10 text-white/70" : standardTone.chip
                )}>
                  <Activity size={12} />
                  {b.savings}
               </div>
            </div>
          )}
        </div>

        {/* Hero Style CTA */}
        <div className="pt-4">
          <ButtonWithIcon 
            variant={isHighlighted ? "white" : (standardTone.button as "white")}
            label={isUserAuthenticated ? 'Start Editing' : 'Get Started'}
            className="!w-full !max-w-none"
            animated={false}
            onClick={() => navigate(isUserAuthenticated ? '/dashboard?view=new-project' : '/free-trial')}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(BundleCard);
