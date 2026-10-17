import { motion } from 'framer-motion';
import { Bot, Box, Cloud, ExternalLink, Share2, Zap } from 'lucide-react';
import { cx, layout, typography } from '../utils/theme';

const INTEGRATIONS = [
  { name: 'Dropbox', status: 'Live', icon: Share2, color: 'rgba(0,0,0,0.8)' },
  { name: 'WeTransfer', status: 'Live', icon: ExternalLink, color: 'rgba(0,0,0,0.8)' },
  { name: 'OneDrive', status: 'Live', icon: Cloud, color: 'rgba(0,0,0,0.8)' },
  { name: 'Amazon', status: 'Coming Soon', icon: Box, color: 'rgba(0,0,0,0.8)' },
  { name: 'Workflow Sync', status: 'Private Beta', icon: Zap, color: '#FF4A00' },
  { name: 'AI Ready', status: 'Live', icon: Bot, color: 'rgba(0,0,0,0.8)' },
];

const Integrations = () => {
  return (
    <section id="integrations" className="relative overflow-hidden bg-surface pt-10 pb-8 sm:pt-12 sm:pb-10 lg:pt-16 lg:pb-12">
      <div className={cx(layout.compactShell, 'relative z-10 px-5 sm:px-6 lg:px-10')}>
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-10">
          <div>
            <h2 className={cx(typography.displayLg, "text-[var(--color-text-primary)]")}>
              Connected <span className="text-black/35">Ecosystem.</span>
            </h2>

            <p className="mt-5 max-w-lg text-[16px] font-medium leading-relaxed text-black/60 lg:text-[17px]">
              Connect Google Drive, Dropbox, automated app workflows, or any AI tool. Files in, edited images out.
            </p>
          </div>

          <div className="rounded-[28px] border border-black/[0.18] bg-white p-3 shadow-[0_18px_60px_-50px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3">
              {INTEGRATIONS.map((item, index) => (
                <motion.article
                  key={item.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.28 }}
                  viewport={{ once: true, margin: '-80px' }}
                  className={cx(
                    'group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white lg:min-h-[150px] lg:flex-col lg:justify-center lg:text-center',
                    'border-black/[0.18] bg-white hover:border-black/18'
                  )}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.18] bg-white transition-transform group-hover:scale-105"
                    style={{ color: item.color }}
                  >
                    <item.icon size={20} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 w-full">
                    <h3 className="break-words whitespace-normal text-[16px] font-bold leading-tight text-black lg:text-[17px]">{item.name}</h3>
                    <p className={cx('mt-1 text-[12px] font-black uppercase tracking-[0.1em]', 'text-black/38')}>
                      {item.status}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="whitespace-nowrap text-[12px] font-black uppercase tracking-[0.15em] text-emerald-600">Live · AI Ready</span>
                <span className="hidden h-3.5 w-px bg-emerald-200 sm:block" />
                <p className="text-[16px] leading-relaxed text-emerald-800/80">
                  Submit orders, track status, and manage revisions from any AI assistant or automation tool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;
