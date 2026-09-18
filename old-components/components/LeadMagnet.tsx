import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Download, Mail, CheckCircle2 } from 'lucide-react';

const LeadMagnet = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(() => localStorage.getItem('reframe_magnet_dismissed') === 'true');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const shouldLiftForCookieBanner = !localStorage.getItem('reframe-cookie-consent');

  useEffect(() => {
    if (isClosed) return;

    // 1. Exit Intent Trigger (Mouse leaves top of window)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10) {
        setIsVisible(true);
      }
    };

    // 2. Time on Site Trigger (30 seconds)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000);

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, [isClosed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsClosed(true);
    localStorage.setItem('reframe_magnet_dismissed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('submitting');

    try {
      const guestId = localStorage.getItem('portal_guest_id');
      await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Guest-ID': guestId || ''
        },
        body: JSON.stringify({
          email,
          metadata: {
            type: 'Lead Magnet Download',
            asset: '2024 E-commerce Imaging Standard',
            source: 'Exit Intent Slide-in'
          }
        })
      });

      setStatus('success');
      
      // Simulate download link or PDF opening
      setTimeout(() => {
        // window.open('/assets/guides/2024-imaging-standard.pdf', '_blank');
        handleDismiss();
      }, 2000);

    } catch (err) {
      setStatus('idle');
    }
  };

  if (isClosed && status !== 'success') return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`fixed left-3 right-3 z-[110] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[24px] border border-white/10 bg-[#171717] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] ${
            shouldLiftForCookieBanner ? 'bottom-64' : 'bottom-3'
          } sm:bottom-8 sm:left-auto sm:right-8 sm:w-[380px] sm:max-h-[calc(100dvh-4rem)]`}
        >
          {/* Close Button */}
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="p-4 sm:p-8">
            {status === 'success' ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center text-center py-3 sm:py-4"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle2 className="text-white" size={24} />
                </div>
                <h3 className="text-white text-lg font-bold mb-2">Guide on the way</h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-[28ch]">
                  We've sent the definitive guide to your inbox. High-conversion imagery starts now.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 mb-4 sm:mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Free Technical Guide</span>
                </div>

                <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight mb-3">
                  2024 E-commerce<br />Imaging Standard .
                </h2>
                
                <p className="text-white/50 text-[13px] leading-relaxed mb-5 sm:mb-8">
                  Get the definitive blueprint for high-conversion visual assets. Used by leading fashion and product studios.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors" size={18} />
                    <input 
                      type="email"
                      placeholder="Your professional email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 sm:h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/20"
                    />
                  </div>

                  <button 
                    disabled={status === 'submitting'}
                    className="w-full h-12 sm:h-14 bg-white text-black rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {status === 'submitting' ? 'Preparing guide...' : 'Download Guide'}
                    <Download size={16} />
                  </button>
                </form>

                <p className="text-white/20 text-[10px] text-center mt-4 sm:mt-6">
                  Built by editors who've worked with top ecommerce brands.
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadMagnet;
