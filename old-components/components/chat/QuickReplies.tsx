import React from 'react';
import { BadgeDollarSign, Headset, Package, Sparkles, Zap } from 'lucide-react';

interface QuickRepliesProps {
  onQuickReply: (text: string) => void;
  disabled?: boolean;
}

const DEFAULT_QUICK_REPLIES = [
  { text: 'View Services', Icon: Sparkles },
  { text: 'View Pricing', Icon: BadgeDollarSign },
  { text: 'Start an Order', Icon: Package },
  { text: 'Talk to Human', Icon: Headset },
];

const QuickReplies: React.FC<QuickRepliesProps> = ({ onQuickReply, disabled }) => {
  return (
    <div className="border-t border-black/5 px-4 py-1.5">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <span className="mb-0.5 flex w-full items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#999]">
          <Zap size={12} />
          Quick replies
        </span>
        <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
          {DEFAULT_QUICK_REPLIES.map((reply, index) => {
        const Icon = reply.Icon;
        return (
          <button
            key={index}
            onClick={() => onQuickReply(reply.text)}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#f5f5f5] rounded-full text-[11px] font-medium text-[#666] hover:bg-[#171717] hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon size={12} strokeWidth={1.75} />
            <span>{reply.text}</span>
          </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default QuickReplies;
