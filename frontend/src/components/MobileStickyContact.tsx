import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, CalendarDays } from 'lucide-react';

const MobileStickyContact: React.FC = () => {
  const location = useLocation();
  const hidden = ['/login', '/signup', '/admin', '/dashboard', '/order'].some((p) => location.pathname.startsWith(p));
  if (hidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[220] border-t border-black/10 bg-white/95 backdrop-blur md:hidden" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="mx-auto flex max-w-xl gap-2 p-2">
        <Link to="/contact" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 text-[13px] font-semibold text-[#171717]">
          <MessageCircle size={14} /> Reframe CS
        </Link>
        <Link to="/book-meeting" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#171717] text-[13px] font-semibold text-white">
          <CalendarDays size={14} /> Book meeting
        </Link>
      </div>
    </div>
  );
};

export default MobileStickyContact;
