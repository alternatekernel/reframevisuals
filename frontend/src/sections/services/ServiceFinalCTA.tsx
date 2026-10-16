import React from 'react';
import { motion } from 'framer-motion';
import { cx, layout, typography, tokens } from '../../utils/theme';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ServiceFinalCTAProps {
  serviceName: string;
  isUserAuthenticated: boolean;
  serviceId?: string;
}

const ServiceFinalCTA: React.FC<ServiceFinalCTAProps> = ({ serviceName, isUserAuthenticated, serviceId }) => {
  const navigate = useNavigate();
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success'>('idle');

  return (
    <section className="bg-white py-12 lg:py-20">
      <div className={cx(layout.compactShell, 'px-5 sm:px-6 lg:px-10')}>
        
        {/* Dark Box Container */}
        <div className="relative w-full bg-[#111] overflow-hidden">
          
          {/* Faint Background Logo Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none mix-blend-screen">
            <img src="/logo.svg" alt="Reframe Visuals" className="w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] object-contain grayscale invert" />
          </div>

          {/* Crosshair / Grid Markers (Top Left, Top Right, Bottom Left, Bottom Right) */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {/* Top horizontal line */}
            <div className="absolute top-16 left-0 right-0 h-[1px] bg-white/10" />
            {/* Bottom horizontal line */}
            <div className="absolute bottom-16 left-0 right-0 h-[1px] bg-white/10" />
            {/* Left vertical line */}
            <div className="absolute top-0 bottom-0 left-16 w-[1px] bg-white/10" />
            {/* Right vertical line */}
            <div className="absolute top-0 bottom-0 right-16 w-[1px] bg-white/10" />
            
            {/* Crosshair Plus signs where lines intersect */}
            <div className="absolute top-[64px] left-[64px] -translate-x-1/2 -translate-y-1/2 text-white/30 text-lg font-light leading-none">+</div>
            <div className="absolute top-[64px] right-[64px] translate-x-1/2 -translate-y-1/2 text-white/30 text-lg font-light leading-none">+</div>
            <div className="absolute bottom-[64px] left-[64px] -translate-x-1/2 translate-y-1/2 text-white/30 text-lg font-light leading-none">+</div>
            <div className="absolute bottom-[64px] right-[64px] translate-x-1/2 translate-y-1/2 text-white/30 text-lg font-light leading-none">+</div>
          </div>

          {/* Content Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 p-10 py-24 sm:p-20 lg:p-32 max-w-[1200px] mx-auto">
            
            {/* Left Column */}
            <div className="flex flex-col justify-center max-w-lg">
              <h2 className="text-white text-[36px] lg:text-[48px] font-bold tracking-[-0.03em] leading-[1.1] mb-6">
                Try it on <br /> your images.
              </h2>
              <p className="text-white/60 text-[16px] lg:text-[18px] leading-relaxed mb-10">
                Submit 3 images and see the results. No payment needed until you approve.
              </p>
              
              <div>
                <button 
                  onClick={() => navigate('/free-trial')}
                  className={cx(
                    "inline-flex items-center gap-4 bg-white text-black pl-6 pr-2 py-2 rounded-full font-bold text-[15px] lg:text-[16px] hover:bg-white/90 active:scale-95 transition-all",
                    tokens.motionInteractive
                  )}
                >
                  Get 3 Free Sample Edits
                  <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-white">
                    <ArrowRight size={16} />
                  </div>
                </button>
                <div className="mt-6 text-[10px] lg:text-[11px] font-bold tracking-[0.15em] text-white/40 uppercase">
                  3 FREE IMAGE EDITS • NO CREDIT CARD REQUIRED
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col justify-center border-t border-white/10 pt-16 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-16">
              <div className="text-[11px] font-bold tracking-[0.1em] text-white/50 uppercase mb-5">
                REQUEST A CUSTOM QUOTE
              </div>
              
              {submitState !== 'success' ? (
                <div className="flex flex-col gap-3">
                  <div className="relative flex items-center w-full max-w-md h-[56px] rounded-full bg-transparent border border-white/20 p-1 transition-[border-color,box-shadow] duration-200 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20">
                    <input
                      type="email"
                      id="quote-email-input"
                      placeholder="Your work email"
                      className="flex-1 bg-transparent pl-5 pr-4 text-white text-[15px] placeholder-white/30 focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        const emailInput = document.getElementById('quote-email-input') as HTMLInputElement;
                        const email = emailInput?.value;
                        if (!email || !email.includes('@')) return;
                        
                        setSubmitState('submitting');
                        try {
                          await fetch('/api/portal/inquiry', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              email, 
                              metadata: { type: 'Service Page Consultation', service: serviceName } 
                            }),
                          });
                          setSubmitState('success');
                        } catch (err) {
                          setSubmitState('idle');
                        }
                      }}
                      disabled={submitState === 'submitting'}
                      className="h-full px-6 bg-white text-black font-bold text-[15px] rounded-full hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      {submitState === 'submitting' ? '...' : 'Submit'}
                    </button>
                  </div>
                  
                  <div className="mt-2 space-y-2">
                    <p className="text-[12px] text-white/40 italic">
                      * No spam or annoying sales messages, guaranteed.
                    </p>
                    <p className="text-[12px] text-white/60">
                      Prefer email? <a href="mailto:hello@reframevisuals.com" className="hover:text-white underline underline-offset-2">hello@reframevisuals.com</a>
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center max-w-md"
                >
                  <p className="text-white text-[16px] font-bold">Request Received</p>
                  <p className="text-white/60 text-[14px] mt-1">We'll reach out within 30 minutes.</p>
                </motion.div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default ServiceFinalCTA;
