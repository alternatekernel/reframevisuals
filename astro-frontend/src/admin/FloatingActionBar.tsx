import React, { useState } from 'react';
import { useContent } from '../context/ContentBase';
import { useToast } from './ToastContext';
import { Trash2, X, ChevronRight, AlertCircle, FileText, CheckCircle2, History, ArrowRight, Zap } from 'lucide-react';
import { cx } from '../utils/theme';

export const FloatingActionBar: React.FC = () => {
  const { 
    getChangedFields, 
    discardChanges, 
    saveAll, 
    syncWithBackend 
  } = useContent();
  
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const changedFields = getChangedFields();
  const hasChanges = changedFields.length > 0;
  const changeCount = changedFields.length;

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      await saveAll();
      showToast('Configuration Vector Committed', 'success');
      setIsExpanded(false);
    } catch {
      showToast('Operational Failure', 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  if (!hasChanges) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div 
        className={cx(
          "bg-black/90 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 ease-in-out relative overflow-hidden",
          isExpanded ? "rounded-[2.5rem] w-[500px]" : "rounded-full w-[280px]"
        )}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--admin-accent)] to-transparent opacity-50" />
        
        <div className="p-4 flex flex-col items-center">
          <div className="flex items-center justify-between w-full px-4 gap-4">
            <div className="flex items-center gap-4">
               <div className="relative">
                 <div className="w-10 h-10 rounded-2xl bg-[var(--admin-accent)] flex items-center justify-center text-black shadow-[0_0_20px_rgba(232,148,58,0.3)] animate-pulse">
                    <Zap size={20} fill="black" />
                 </div>
                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-black">
                   {changeCount}
                 </div>
               </div>
               <div className="flex flex-col">
                  <span className="text-[12px] font-black text-white uppercase tracking-widest leading-none mb-1">STAGED_DELTAS</span>
                  <span className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase tracking-tighter opacity-60">System Ready for Commit</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all transform active:scale-90"
              >
                <ChevronRight className={cx("transition-transform duration-500", isExpanded ? "rotate-90" : "rotate-0")} size={18} />
              </button>
              
              <button 
                onClick={handleCommit}
                disabled={isCommitting}
                className="px-6 py-3 bg-[var(--admin-accent)] text-black rounded-2xl text-[12px] font-black uppercase tracking-tighter hover:scale-[1.02] active:scale-[0.97] transition-all shadow-[0_0_30px_rgba(232,148,58,0.2)] disabled:opacity-20 flex items-center gap-2"
              >
                {isCommitting ? <History className="animate-spin" size={14} /> : <CheckCircle2 size={14} strokeWidth={3} />}
                COMMIT
              </button>
            </div>
          </div>

          {/* Expanded State: Change List */}
          {isExpanded && (
            <div className="w-full mt-6 px-4 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
               <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6 max-h-[400px] overflow-y-auto admin-scroll-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                     <span className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileText size={12} /> Transaction Manifest
                     </span>
                     <button 
                       onClick={() => discardChanges()}
                       className="text-[10px] font-black text-[var(--admin-red)] uppercase tracking-widest hover:underline flex items-center gap-1.5"
                     >
                       <Trash2 size={12} /> Discard All
                     </button>
                  </div>

                  {changedFields.map((field, idx) => (
                    <div key={`${field.sectionId}-${field.fieldKey}-${idx}`} className="group relative">
                       <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                             <div className="text-[11px] font-black text-white uppercase truncate tracking-tight">
                               {field.sectionLabel}: {field.fieldKey}
                             </div>
                             <div className="text-[9px] font-bold text-[var(--admin-text-3)] uppercase mt-0.5 opacity-40">SECTION: {field.sectionId}</div>
                          </div>
                          <div className="text-[11px] font-[var(--admin-font-mono)] text-[var(--admin-accent)] bg-[var(--admin-accent-dim)] px-2.5 py-1 rounded-md border border-[var(--admin-accent)]/10">
                             MODIFIED
                          </div>
                       </div>
                       
                       <div className="mt-3 grid grid-cols-[1fr_20px_1fr] items-center gap-3">
                          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                             <div className="text-[8px] font-black text-[var(--admin-text-3)] uppercase mb-2 tracking-widest">ORIGIN_VECTOR</div>
                             <div className="text-[11px] text-white/40 line-clamp-2 italic">{String(field.oldValue).substring(0, 40) || 'NULL'}</div>
                          </div>
                          <div className="flex justify-center"><ArrowRight className="text-[var(--admin-text-3)] rotate-90 opacity-20" size={12} /></div>
                          <div className="bg-[var(--admin-accent-dim)]/20 rounded-xl p-3 border border-[var(--admin-accent)]/10">
                             <div className="text-[8px] font-black text-[var(--admin-accent)] uppercase mb-2 tracking-widest">TARGET_DELTA</div>
                             <div className="text-[11px] text-[var(--admin-accent)] line-clamp-2">{String(field.newValue).substring(0, 40)}</div>
                          </div>
                       </div>

                       <button className="absolute -right-2 top-0 p-1 text-[var(--admin-text-3)] hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                          <X size={12} />
                       </button>
                    </div>
                  ))}
               </div>

               <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <AlertCircle size={12} className="text-[var(--admin-blue)]" />
                     <span className="text-[10px] font-bold text-[var(--admin-text-3)] uppercase tracking-tighter">Automatic deployment sequence enabled on commit</span>
                  </div>
                  <button className="text-white hover:text-[var(--admin-accent)] transition-colors transform active:scale-95" onClick={() => syncWithBackend()}>
                    <History size={16} />
                  </button>
               </div>
               
               <div className="mt-4 mb-2 flex justify-center">
                  <div className="w-1/4 h-1 bg-white/5 rounded-full" />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
