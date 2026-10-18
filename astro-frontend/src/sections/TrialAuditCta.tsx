import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicInput } from '../components/ui/form-controls';
import { motion } from 'framer-motion';

const TrialAuditCta = () => {
  const navigate = useNavigate();
  const [auditEmail, setAuditEmail] = useState('');

  return (
    <section className="w-full max-w-3xl mx-auto px-6 text-center pt-4 pb-10 lg:pt-5 lg:pb-12 overflow-visible">
      <div className="flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full space-y-4 overflow-hidden rounded-[28px] border border-[#BAE6FD]/80 animate-card-bg p-5 shadow-[0_18px_48px_rgba(15,23,42,0.14)] sm:p-7"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/55 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#BFDBFE]/35 blur-2xl" />

          <h3 className="relative z-10 text-[22px] font-semibold leading-[1.15] tracking-tight text-[var(--color-text-primary)] lg:text-[28px]">
            See the edit quality before you pay.
          </h3>
          <p className="relative z-10 mx-auto max-w-xl text-[15px] font-medium leading-relaxed text-black/70">
            Submit your images. We&apos;ll edit them and send back the before/after.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = auditEmail.trim() ? `?email=${encodeURIComponent(auditEmail.trim())}` : '';
              navigate(`/free-trial${query}`);
            }}
            className="relative z-10 mt-6 mx-auto grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto] sm:items-stretch"
          >
            <PublicInput
              type="email"
              placeholder="Enter your work email"
              required
              value={auditEmail}
              onChange={(e) => setAuditEmail(e.target.value)}
              className="bg-white/95"
            />
            <button
              type="submit"
              className="group inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--color-text-primary)] py-1.5 pl-6 pr-1.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-all hover:bg-black active:scale-95 sm:min-h-full"
            >
              <span>Get 3 Free Sample Edits</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black">
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </button>
          </form>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[14px] font-medium text-black/70">
            <span>Replies within 30 min</span>
            <span className="hidden text-black/25 sm:inline">•</span>
            <span>No spam, ever</span>
            <span className="hidden text-black/25 sm:inline">•</span>
            <span>Editor on every image</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrialAuditCta;
