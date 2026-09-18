import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useHeroSectionVisibility } from '../../hooks/useHeroSectionVisibility';

const getPageTitle = () => {
  if (typeof document === 'undefined') return '';
  return document.title.replace(/\s*\|\s*Reframe.*$/i, '').trim();
};

export const GlobalFeedbackWidget: React.FC = () => {
  const location = useLocation();
  const isHeroVisible = useHeroSectionVisibility();
  const [isReframeCsOpen, setIsReframeCsOpen] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.body.getAttribute('data-reframe-cs-open') === 'true';
  });

  useEffect(() => {
    const handleState = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      const next = Boolean(customEvent.detail?.open);
      setIsReframeCsOpen(next);
    };

    const handleBodyMutation = () => {
      setIsReframeCsOpen(document.body.getAttribute('data-reframe-cs-open') === 'true');
    };

    window.addEventListener('reframe-cs:state', handleState);
    const observer = new MutationObserver(handleBodyMutation);
    if (typeof document !== 'undefined') {
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-reframe-cs-open'] });
    }

    return () => {
      window.removeEventListener('reframe-cs:state', handleState);
      observer.disconnect();
    };
  }, []);

  if (isHeroVisible || isReframeCsOpen) {
    return null;
  }

  const handleOpenSupportChat = () => {
    const pageTitle = getPageTitle() || 'this page';
    const pagePath = location.pathname;
    window.dispatchEvent(new CustomEvent('reframe-cs:open', {
      detail: {
        mode: 'feedback-escalation',
        issueType: 'general',
        pageTitle,
        pagePath,
        prompt: `Hi, I need help with a general issue on ${pageTitle} (${pagePath}).`
      }
    }));
  };

  return (
    <div className="global-feedback-widget fixed bottom-6 right-6 z-50 font-sans selection:bg-onyx/10">
      <button
        type="button"
        onClick={handleOpenSupportChat}
        className="flex h-12 items-center gap-2 rounded-full bg-onyx px-4 text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Open Reframe CS for human support"
      >
        <MessageSquare size={18} />
        <span className="text-[13px] font-bold">Feedback</span>
      </button>
    </div>
  );
};
