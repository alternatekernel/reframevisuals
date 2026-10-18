import React, { useState } from 'react';
import { Bot, Key, MessageSquare, Terminal, Shield, Zap, Sparkles, Sliders, RefreshCw, Save } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';

export const ChatbotConfigPage: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [config, setConfig] = useState({
    providerTokenPreview: 'configured in server environment',
    persona: 'helpful',
    temperature: 0.7,
    maxTokens: 1024,
    proactiveTriggers: true,
    contextAwareness: true,
  });

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader
        title="AI Chatbot"
        description="Configure the Reframe AI chatbot persona, behavior, and API settings."
        parentPage="Systems / AI"
      />

      {/* Controller Area */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
        
        {/* Main Settings Vector */}
        <div className="space-y-6">
          <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--admin-accent)] to-transparent opacity-30" />
             
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-[var(--admin-accent-dim)] border border-[var(--admin-accent)]/20 flex items-center justify-center text-[var(--admin-accent)]">
                   <Bot size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight">Chatbot Configuration</h3>
                   <p className="text-[12px] text-[var(--admin-text-3)] font-semibold uppercase tracking-widest opacity-60">Persona & API Settings</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div>
                      <label className="block text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Key size={12} className="text-[var(--admin-accent)]" /> Gemini API Authentication Vector
                      </label>
                      <div className="relative group">
                         <input 
                           type="password" 
                           value={config.providerTokenPreview}
                           onChange={e => setConfig({...config, providerTokenPreview: e.target.value})}
                           className="w-full bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl px-6 py-4 text-[14px] font-[var(--admin-font-mono)] text-[var(--admin-text)] focus:border-[var(--admin-accent)] outline-none transition-all pr-12"
                         />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--admin-text-3)] opacity-40 group-hover:opacity-100 transition-opacity">
                            <Shield size={16} />
                         </div>
                      </div>
                      <p className="mt-2.5 text-[10px] text-[var(--admin-text-3)] font-medium leading-relaxed italic opacity-70">
                        Encrypted signal path. Key is isolated from frontend runtime.
                      </p>
                   </div>

                   <div>
                      <label className="block text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MessageSquare size={12} className="text-[var(--admin-accent)]" /> Persona Directive
                      </label>
                      <select 
                        value={config.persona}
                        onChange={e => setConfig({...config, persona: e.target.value})}
                        className="w-full bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl px-6 py-4 text-[14px] font-black text-[var(--admin-text)] focus:border-[var(--admin-accent)] outline-none transition-all appearance-none cursor-pointer uppercase tracking-tighter"
                      >
                         <option value="helpful">Expert Assistant (Balanced)</option>
                         <option value="professional">Technical Consultant (Precise)</option>
                         <option value="friendly">Support Liaison (Creative)</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="block text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-3">
                           Temperature
                         </label>
                         <input 
                           type="number" 
                           step="0.1"
                           min="0"
                           max="1"
                           value={config.temperature}
                           onChange={e => setConfig({...config, temperature: parseFloat(e.target.value)})}
                           className="w-full bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl px-6 py-4 text-[14px] font-[var(--admin-font-mono)] text-[var(--admin-text)] focus:border-[var(--admin-accent)] outline-none transition-all"
                         />
                      </div>
                      <div>
                         <label className="block text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mb-3">
                           Max Tokens
                         </label>
                         <input 
                           type="number" 
                           value={config.maxTokens}
                           onChange={e => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                           className="w-full bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl px-6 py-4 text-[14px] font-[var(--admin-font-mono)] text-[var(--admin-text)] focus:border-[var(--admin-accent)] outline-none transition-all"
                         />
                      </div>
                   </div>

                   <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between p-4 bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl group hover:border-[var(--admin-accent)]/30 transition-all">
                         <div className="flex items-center gap-3">
                            <Sparkles size={16} className="text-[var(--admin-accent)]" />
                            <span className="text-[12px] font-black text-[var(--admin-text)] uppercase tracking-tight">Proactive Notifications</span>
                         </div>
                         <button 
                           onClick={() => setConfig({...config, proactiveTriggers: !config.proactiveTriggers})}
                           className={cx(
                             "w-12 h-6 rounded-full relative transition-all duration-500",
                             config.proactiveTriggers ? "bg-[var(--admin-accent)]" : "bg-[var(--admin-surface-3)]"
                           )}
                         >
                            <div className={cx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-lg", config.proactiveTriggers ? "left-7" : "left-1")} />
                         </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl group hover:border-[var(--admin-blue)]/30 transition-all">
                         <div className="flex items-center gap-3">
                            <Sliders size={16} className="text-[var(--admin-blue)]" />
                            <span className="text-[12px] font-black text-[var(--admin-text)] uppercase tracking-tight">Contextual Awareness</span>
                         </div>
                         <button 
                           onClick={() => setConfig({...config, contextAwareness: !config.contextAwareness})}
                           className={cx(
                             "w-12 h-6 rounded-full relative transition-all duration-500",
                             config.contextAwareness ? "bg-[var(--admin-blue)]" : "bg-[var(--admin-surface-3)]"
                           )}
                         >
                            <div className={cx("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-lg", config.contextAwareness ? "left-7" : "left-1")} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-12 flex items-center justify-between pt-8 border-t border-[var(--admin-border)]">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 group cursor-help">
                      <Terminal size={14} className="text-[var(--admin-text-3)]" />
                      <span className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest hover:text-[var(--admin-text)] transition-colors">DEBUG_MODE_V4</span>
                   </div>
                </div>
                <button className="flex items-center gap-2 px-8 py-3.5 bg-[var(--admin-accent)] text-black rounded-2xl text-[14px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(232,148,58,0.3)] uppercase tracking-tighter">
                   <Save size={18} strokeWidth={3} /> Save Settings
                </button>
             </div>
          </div>
        </div>

        {/* Status Radar */}
        <div className="space-y-6">
           <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-8 shadow-xl">
              <h4 className="text-[12px] font-black text-[var(--admin-text)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Activity size={14} className="text-[var(--admin-accent)]" /> Core Health
              </h4>
              <div className="space-y-6">
                 {[
                   { label: 'Latency (P99)', value: '184ms', status: 'optimal' },
                   { label: 'Tokens Used', value: '42.8k', status: 'normal' },
                   { label: 'Requests/h', value: '1.2k', status: 'elevated' },
                   { label: 'CPU Load', value: '14%', status: 'low' },
                 ].map((stat, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-[var(--admin-text-3)] uppercase">{stat.label}</div>
                      <div className="text-[12px] font-black text-[var(--admin-text)] font-[var(--admin-font-mono)]">{stat.value}</div>
                   </div>
                 ))}
              </div>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full mt-10 py-4 bg-[var(--admin-surface-2)] border border-[var(--admin-border)] rounded-2xl text-[11px] font-black text-[var(--admin-text-2)] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[var(--admin-surface-3)] transition-all group"
              >
                 <RefreshCw size={14} className={cx("transition-transform", isSyncing && "animate-spin")} />
                 {isSyncing ? "Syncing..." : "Sync API State"}
              </button>
           </div>

           <div className="bg-gradient-to-br from-[var(--admin-accent)] to-[var(--admin-purple)] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-black">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                 <Zap size={120} fill="black" />
              </div>
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">System Insight</h4>
              <p className="text-[14px] font-bold leading-relaxed mb-6">
                Direct cognitive mapping is active. The AI core is currently synchronized with the global platform knowledge base.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black/10 w-fit px-3 py-1.5 rounded-lg">
                 Version Matrix 4.2.0-STABLE
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const Activity: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);
