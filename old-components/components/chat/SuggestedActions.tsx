import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface SuggestedAction {
  text: string;
  url?: string;
}

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onActionClick?: (action: SuggestedAction) => void;
}

const SuggestedActions: React.FC<SuggestedActionsProps> = ({ actions, onActionClick }) => {
  const navigate = useNavigate();

  if (!actions || actions.length === 0) return null;

  const handleClick = (action: SuggestedAction) => {
    if (onActionClick) {
      onActionClick(action);
      return;
    }

    if (action.url) {
      if (action.url.startsWith('/')) {
        navigate(action.url);
      } else {
        window.open(action.url, '_blank');
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, index) => {
        const isExternal = action.url && !action.url.startsWith('/');
        
        return (
          <button
            key={index}
            onClick={() => handleClick(action)}
            className="group flex items-center gap-1.5 px-3 py-1 bg-white border border-black/10 rounded-full text-[11px] font-medium text-[#171717] hover:border-[#171717] hover:bg-[#fafafa] transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <span>{action.text}</span>
            {isExternal ? (
              <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
            ) : (
              <ArrowRight size={12} className="opacity-60 transition-all duration-300 group-hover:-rotate-45 group-hover:opacity-100" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SuggestedActions;