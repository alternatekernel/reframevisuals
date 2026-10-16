import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  // The chat widget asks a guest for their contact details inside the conversation.
  // Two popups at once reads as pushy, so the cookie banner yields while chat is open.
  const [isChatOpen, setIsChatOpen] = useState(
    () => typeof document !== 'undefined' && document.body.hasAttribute('data-reframe-cs-open')
  );
  const location = useLocation();
  const quietCookieRoutes = ['/contact', '/login', '/signup', '/forgot-password', '/reset-password'];
  const shouldStayQuiet = quietCookieRoutes.includes(location.pathname) || isChatOpen;

  useEffect(() => {
    const handleChatState = (event: Event) => {
      setIsChatOpen(Boolean((event as CustomEvent).detail?.open));
    };
    window.addEventListener('reframe-cs:state', handleChatState);
    return () => window.removeEventListener('reframe-cs:state', handleChatState);
  }, []);

  useEffect(() => {
    if (shouldStayQuiet) {
      setIsVisible(false);
      return;
    }
    // Check if user has already consented
    const consent = localStorage.getItem('reframe-cookie-consent');
    if (!consent) {
      // Small delay to make it feel deliberate
      const timer = setTimeout(() => setIsVisible(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [shouldStayQuiet]);

  const handleAccept = () => {
    localStorage.setItem('reframe-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('reframe-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 sm:right-auto z-[9999] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[360px]"
        >
          <div className="bg-[#fcfcfc] border border-black/5 rounded-[12px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Cookie className="text-black/80 w-[16px] h-[16px]" />
              <h3 className="text-[14px] font-bold text-black tracking-tight">
                Cookie Policy
              </h3>
            </div>
            
            <p className="text-[12px] text-black/60 leading-[1.45] font-normal">
              This website uses third party cookies to serve you relevant ads and provide personalization by remembering your location. You may opt out from these cookies by selecting the "Opt out" button below. If you have a Reframe account, you may opt out of the "sale" or "sharing" of your data <a href="/privacy" className="underline hover:text-black transition-colors">in our Privacy Policy</a>.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <button 
                onClick={handleDecline}
                className="w-full sm:w-auto px-4 py-2 bg-black/[0.06] hover:bg-black/[0.1] text-black text-[12px] font-semibold rounded-[8px] transition-all"
              >
                Opt out
              </button>
              <button 
                onClick={handleAccept}
                className="w-full sm:w-auto px-5 py-2 bg-[#1a1a1a] hover:bg-black text-white text-[12px] font-semibold rounded-[8px] transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
