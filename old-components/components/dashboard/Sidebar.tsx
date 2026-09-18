import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, User, Box, Clock, CreditCard, MessageSquare, Layers, LogOut, ExternalLink, Headset, Image } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useContent } from '../../context/ContentBase';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentView, conversations, activeConversation, setActiveConversation, setCurrentView } = useDashboard();
  const { userLogout, currentUser } = useContent();
  const viewParam = searchParams.get('view');

  const NAV_ITEMS = [
    { id: 'chat', label: 'Chat', icon: Headset, path: '/dashboard?view=chat' },
    { id: 'jobs', label: 'Active Projects', icon: Layers, path: '/dashboard' },
    { id: 'orders', label: 'Order History', icon: Clock, path: '/dashboard/orders' },
    { id: 'gallery', label: 'Gallery', icon: Image, path: '/dashboard/gallery' },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard, path: '/dashboard/billing' },
  ] as const;
  const chatNavItem = NAV_ITEMS[0];
  const secondaryNavItems = NAV_ITEMS.slice(1);

  return (
    <div className="flex flex-col h-full font-satoshi selection:bg-brand-ink/10">
      <div className="p-6 border-b shrink-0 space-y-6" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <button onClick={() => { navigate('/dashboard'); onNavigate?.(); }} className="flex items-center gap-3 group transition-all">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-ink shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)] group-hover:scale-105 transition-transform">
            <Box size={16} color="#ffffff" strokeWidth={1.5} />
          </div>
          <span className="text-[14px] font-bold tracking-[-0.02em] text-text-primary">Reframe CS</span>
        </button>

        <button 
          onClick={() => {
            setCurrentView('orderFlow');
            navigate('/dashboard?view=new-project');
            onNavigate?.();
          }}
          className="w-full flex items-center justify-center gap-2 bg-brand-ink text-white py-2.5 rounded-full text-[13px] font-semibold hover:opacity-90 transition-all active:scale-[0.98] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)]"
        >
          <Plus size={16} strokeWidth={2} />
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
        <nav className="px-4 space-y-1 mb-6">
          {[chatNavItem].map((item) => {
            const isActive = item.id === 'chat'
              ? currentView === 'chat' || viewParam === 'chat'
              : item.id === currentView;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  navigate(item.path);
                  onNavigate?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left tracking-[-0.01em] ${
                  isActive 
                    ? 'bg-white text-text-primary shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)]' 
                    : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Conversations Section */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30">Recent Chats</h3>
            <MessageSquare size={10} className="text-black/30" />
          </div>
          <div className="space-y-1">
            {conversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversation(conv);
                  setCurrentView('chat');
                  navigate('/dashboard?view=chat');
                  onNavigate?.();
                }}
                className={`w-full group px-4 py-2.5 rounded-lg text-left transition-all ${
                  activeConversation?.id === conv.id 
                    ? 'bg-white text-text-primary shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08)]' 
                    : 'text-text-secondary hover:bg-black/5'
                }`}
              >
                <div className="flex justify-between items-start mb-0.5">
                  <span className={`text-[13px] truncate tracking-[-0.01em] ${conv.unread ? 'font-bold text-text-primary' : 'font-medium'}`}>
                    {conv.title}
                  </span>
                  {conv.unread && <div className="w-1.5 h-1.5 rounded-full bg-brand-ink mt-1.5 shadow-[0px_0px_4px_rgba(0,0,0,0.2)]" />}
                </div>
                <p className="text-[11px] text-black/40 truncate font-medium tracking-tight">{conv.lastMessage}</p>
              </button>
            ))}
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = item.id === currentView;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  navigate(item.path);
                  onNavigate?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left tracking-[-0.01em] ${
                  isActive 
                    ? 'bg-white text-text-primary shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)]' 
                    : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Search/Actions */}
      <div className="p-6 border-t shrink-0 bg-[#FDFDFD] space-y-2" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <button
          onClick={() => { setCurrentView('account'); navigate('/dashboard/account'); onNavigate?.(); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left tracking-[-0.01em] ${
            currentView === 'account'
              ? 'bg-white text-text-primary shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_2px_2px_rgba(0,0,0,0.04)]'
              : 'text-text-secondary hover:bg-black/5 hover:text-text-primary'
          }`}
        >
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-black/50">
              {currentUser?.name?.[0]?.toUpperCase() ?? <User size={10} strokeWidth={1.5} />}
            </div>
          )}
          Settings & Profile
        </button>

        <button
          onClick={() => { navigate('/'); onNavigate?.(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-black/5 hover:text-text-primary transition-all text-left tracking-[-0.01em]"
        >
          <ExternalLink size={14} strokeWidth={1.5} />
          View Website
        </button>

        <button
          onClick={() => {
            userLogout();
            navigate('/login');
            onNavigate?.();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-all text-left tracking-[-0.01em]"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
