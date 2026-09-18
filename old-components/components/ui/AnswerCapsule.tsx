import { motion } from 'framer-motion';

interface AnswerCapsuleProps {
  headline: string;
  description: string;
  keywords?: string[];
  className?: string;
}

export function AnswerCapsule({ headline, description, keywords, className = '' }: AnswerCapsuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`mb-8 lg:mb-12 ${className}`}
    >
      {/* AI-Optimized Answer Capsule - Neutral Stealth Style */}
      <div className="bg-gradient-to-r from-black/5 via-black/5 to-transparent border-l-4 border-black/20 pl-6 pr-8 py-4 rounded-r-lg">
        <p className="font-heading text-[18px] lg:text-[20px] font-black tracking-tight text-black/90 leading-snug">
          <span className="text-black/40">Answer: </span>
          {headline}
        </p>
      </div>
      
      {/* AI-Parseable Summary */}
      <p className="text-[15px] lg:text-[16px] text-black/60 leading-relaxed mt-4 max-w-3xl">
        {description}
      </p>
      
      {/* Hidden keywords for AI parsing */}
      {keywords && (
        <div className="sr-only" aria-hidden="true">
          {keywords.join(', ')}
        </div>
      )}
    </motion.div>
  );
}

// Quick stats badge for credibility
interface TrustBadgeProps {
  value: string;
  label: string;
  source: string;
  className?: string;
}

export function TrustBadge({ value, label, source, className = '' }: TrustBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black/5 border border-black/10 ${className}`}>
      <span className="text-[18px] font-heading font-black text-black/80">{value}</span>
      <span className="text-[13px] text-black/60">{label}</span>
      <span className="text-[10px] text-black/30">via {source}</span>
    </div>
  );
}

// Last Updated timestamp
interface LastUpdatedProps {
  date?: string;
  className?: string;
}

export function LastUpdated({ date, className = '' }: LastUpdatedProps) {
  const displayDate = date || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
   });
  
  return (
    <p className={`text-[12px] text-black/30 ${className}`} suppressHydrationWarning>
      Last updated: {displayDate}
    </p>
  );
}

export default AnswerCapsule;