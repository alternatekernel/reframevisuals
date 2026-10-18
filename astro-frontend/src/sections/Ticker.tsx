import { useContent } from '../context/ContentBase';
import { 
  Target, Tag, Zap, Clock, Lock, 
  Headphones, RotateCcw, Cloud, Sparkles, 
  GitBranch, Building, Code, FileUp, Database, EyeOff 
} from 'lucide-react';

const getIcon = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes('pixel') || t.includes('quality')) return Target;
  if (t.includes('$') || t.includes('discount')) return Tag;
  if (t.includes('12h') || t.includes('turnaround')) return Clock;
  if (t.includes('secure') || t.includes('delivery')) return Lock;
  if (t.includes('support')) return Headphones;
  if (t.includes('revision')) return RotateCcw;
  if (t.includes('cloud') || t.includes('upload')) return Cloud;
  if (t.includes('ai') || t.includes('spark')) return Sparkles;
  if (t.includes('api')) return Code;
  if (t.includes('enterprise')) return Building;
  if (t.includes('bulk')) return FileUp;
  if (t.includes('workflow')) return GitBranch;
  if (t.includes('metadata')) return Database;
  if (t.includes('privacy')) return EyeOff;
  return Zap;
};

const Ticker = () => {
  const { getSectionContent } = useContent();
  const content = getSectionContent('ticker');
  const items = content.items || [];

  return (
    <div className="relative z-20 bg-[var(--color-text-primary)]">
      <div className="group relative overflow-hidden py-2 select-none cursor-default">
        {/* Edge Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-[#171717] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-[#171717] to-transparent" />

        <div className="flex items-center animate-marquee overflow-x-auto scrollbar-hide sm:overflow-visible sm:will-change-transform sm:group-hover:[animation-play-state:paused]" style={{ animationDuration: '16s' }}>
          {[...items, ...items, ...items].map((text: string, i: number) => {
            const Icon = getIcon(text);
            return (
              <div key={i} className="flex items-center gap-0 shrink-0">
                <div className="flex items-center gap-2 px-4 lg:px-6">
                  <Icon size={14} className="text-white/30" />
                  <span className="font-body text-[14px] sm:text-[16px] font-light tracking-tight text-white/50 transition-colors hover:text-white">
                    {text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Ticker;

