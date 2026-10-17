import React from 'react';
import { HardDrive, Cloud, FileText, Settings, Upload, Download, MoreHorizontal, Layout, Box, Hash, Globe, Clock, ChevronRight, BarChart2, Plus } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { cx } from '../../utils/theme';

interface StorageCategory {
  label: string;
  size: number;
  color: string;
}

export const CMSStoragePage: React.FC = () => {
  const storage = {
    totalUsed: 45.2,
    totalLimit: 100,
    byCategory: [
      { label: 'Raw Imagery', size: 22.5, color: 'var(--admin-accent)' },
      { label: 'Post-Production', size: 15.3, color: 'var(--admin-blue)' },
      { label: 'Legal Docs', size: 4.2, color: 'var(--admin-purple)' },
      { label: 'System Cache', size: 3.2, color: 'var(--admin-text-3)' },
    ] as StorageCategory[],
    autoArchiveEnabled: true,
    archiveAfterDays: 90,
  };

  const pages = [
    { id: '1', title: 'Main Terminal', slug: '/', status: 'published', updated: '2026-03-20', views: 12453 },
    { id: '2', title: 'Services', slug: '/services', status: 'published', updated: '2026-03-18', views: 5234 },
    { id: '3', title: 'Fiscal Matrix', slug: '/pricing', status: 'published', updated: '2026-03-15', views: 8921 },
    { id: '4', title: 'About', slug: '/about', status: 'draft', updated: '2026-03-10', views: 0 },
  ];

  const recentFiles = [
    { name: 'nike-product-001.jpg', size: '4.2MB', type: 'image', date: '2h ago' },
    { name: 'amazon-batch-047.zip', size: '1.4GB', type: 'archive', date: '5h ago' },
    { name: 'contract-techstart.pdf', size: '124KB', type: 'document', date: '1d ago' },
    { name: 'styleguide-v2.3.pdf', size: '14.5MB', type: 'document', date: '1d ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <SectionHeader
        title="CMS & Storage"
        description="Manage site content and monitor storage usage."
        parentPage="Infrastructure / CMS"
      />

      {/* Storage Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><HardDrive size={80} /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h4 className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-1">Total Storage Used</h4>
                  <div className="text-[36px] font-[var(--admin-font-display)] font-black text-[var(--admin-text)] tracking-tighter">
                    {storage.totalUsed} GB <span className="text-[16px] text-[var(--admin-text-3)] font-black uppercase">/ {storage.totalLimit} GB</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-[0.2em] mb-1">Utilization</div>
                  <div className="text-[20px] font-black text-[var(--admin-accent)]">{(storage.totalUsed / storage.totalLimit * 100).toFixed(1)}%</div>
               </div>
            </div>

            <div className="h-4 w-full bg-[var(--admin-surface-3)] rounded-full overflow-hidden flex p-1 border border-[var(--admin-border)] shadow-inner mb-10">
               {storage.byCategory.map((cat, i) => (
                 <div 
                   key={i} 
                   className="h-full first:rounded-l-full last:rounded-r-full border-r border-black/[0.18] last:border-0" 
                   style={{ width: `${(cat.size / storage.totalLimit) * 100}%`, backgroundColor: cat.color }} 
                 />
               ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {storage.byCategory.map((cat, i) => (
                 <div key={i} className="space-y-1">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                     <span className="text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">{cat.label}</span>
                   </div>
                   <div className="text-[15px] font-[var(--admin-font-mono)] font-black text-[var(--admin-text)] pl-4">{cat.size} GB</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between h-[calc(50%-12px)]">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-blue)] shadow-lg"><Cloud size={20} /></div>
                    <div className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Cloud Provider</div>
                 </div>
                 <div className="px-2 py-0.5 bg-[var(--admin-green-dim)] text-[var(--admin-green)] text-[9px] font-black rounded-md border border-[var(--admin-green)]/20 uppercase tracking-widest">Connected</div>
              </div>
              <div>
                 <div className="text-[20px] font-black text-[var(--admin-text)] tracking-tight uppercase">AWS S3 BUCKET</div>
                 <div className="text-[11px] font-medium text-[var(--admin-text-3)] mt-0.5">Region: us-east-1_IAD</div>
              </div>
           </div>
           
           <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between h-[calc(50%-12px)]">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-accent)] shadow-lg"><Settings size={20} /></div>
                    <div className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest">Auto-Archive</div>
                 </div>
                 <div className={cx(
                    "w-10 h-5 rounded-full relative transition-all cursor-pointer",
                    storage.autoArchiveEnabled ? "bg-[var(--admin-green)]" : "bg-[var(--admin-surface-3)]"
                 )}>
                    <div className={cx(
                       "absolute top-1 w-3 h-3 rounded-full bg-black transition-all",
                       storage.autoArchiveEnabled ? "right-1" : "left-1"
                    )} />
                 </div>
              </div>
              <div>
                 <div className="text-[20px] font-black text-[var(--admin-text)] tracking-tight uppercase">ARCHIVE_TRIGGER</div>
                 <div className="text-[11px] font-medium text-[var(--admin-text-3)] mt-0.5">Policy: {storage.archiveAfterDays} Days of Inactivity</div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Page Management Terminal */}
         <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex items-center justify-between">
               <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3 font-[var(--admin-font-display)]">
                  <Globe size={20} className="text-[var(--admin-accent)]" /> Site Nodes
               </h3>
               <button className="flex items-center gap-2 px-6 py-2 bg-[var(--admin-accent)] text-black rounded-xl text-[11px] font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--admin-accent)]/20 uppercase tracking-widest">
                  <Plus size={16} strokeWidth={3} /> NEW_PAGE
               </button>
            </div>
            <div className="divide-y divide-[var(--admin-border)] bg-[var(--admin-bg)]/10 flex-1">
               {pages.map(page => (
                 <div key={page.id} className="px-8 py-6 flex items-center justify-between hover:bg-[var(--admin-surface-2)]/40 transition-colors group">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-3)] group-hover:text-[var(--admin-accent)] transition-all shadow-xl">
                         <Layout size={20} />
                      </div>
                      <div>
                        <div className="text-[15px] font-black text-[var(--admin-text)] tracking-tight uppercase">{page.title}</div>
                        <div className="text-[11px] font-[var(--admin-font-mono)] text-[var(--admin-text-3)]">{page.slug}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                         <div className="flex items-center justify-end gap-1.5 text-[14px] font-black text-[var(--admin-text)]">
                            <BarChart2 size={14} className="text-[var(--admin-blue)]" /> {page.views.toLocaleString()}
                         </div>
                         <div className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-widest mt-0.5">Total Impressions</div>
                      </div>
                      <span className={cx(
                         "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border",
                         page.status === 'published' ? "bg-[var(--admin-green-dim)] text-[var(--admin-green)] border-[var(--admin-green)]/20" : "bg-[var(--admin-surface-3)] text-[var(--admin-text-3)] border-[var(--admin-border)]"
                      )}>
                        {page.status}
                      </span>
                      <button className="p-2 text-[var(--admin-text-3)] hover:text-[var(--admin-accent)] transition-all">
                         <ChevronRight size={20} />
                      </button>
                   </div>
                 </div>
               ))}
            </div>
            <div className="px-8 py-5 border-t border-[var(--admin-border)] bg-[var(--admin-surface-2)]/30 text-center">
               <button className="text-[11px] font-black text-[var(--admin-text-3)] uppercase tracking-widest hover:text-[var(--admin-text)] transition-all">View Full Node Graph Intelligence</button>
            </div>
         </div>

         {/* File Stream Terminal */}
         <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-8 py-6 border-b border-[var(--admin-border)] bg-[var(--admin-surface-2)]/50 flex items-center justify-between">
               <h3 className="text-[18px] font-black text-[var(--admin-text)] uppercase tracking-tight flex items-center gap-3 font-[var(--admin-font-display)]">
                  <Box size={20} className="text-[var(--admin-blue)]" /> Storage Fragments
               </h3>
               <button className="flex items-center gap-2 px-6 py-2 bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text)] rounded-xl text-[11px] font-black hover:bg-[var(--admin-surface-2)] transition-all uppercase tracking-widest">
                  <Upload size={16} /> UPLOAD_DATA
               </button>
            </div>
            <div className="divide-y divide-[var(--admin-border)] bg-[var(--admin-bg)]/10 flex-1">
               {recentFiles.map((file, i) => (
                 <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-[var(--admin-surface-2)]/40 transition-colors group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-text-3)] group-hover:text-[var(--admin-blue)] transition-all">
                         <FileText size={18} />
                      </div>
                      <div>
                        <div className="text-[14px] font-black text-[var(--admin-text)] tracking-tight truncate max-w-[200px] uppercase leading-none mb-1">{file.name}</div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-[var(--admin-text-3)] uppercase tracking-tighter opacity-70">
                           <span className="flex items-center gap-1"><Hash size={10} /> {file.size}</span>
                           <span className="flex items-center gap-1"><Clock size={10} /> {file.date}</span>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all shadow-lg shadow-black/20 hover:shadow-[var(--admin-blue)]/10">
                         <Download size={16} />
                      </button>
                      <button className="p-2.5 rounded-xl bg-[var(--admin-surface-3)] border border-[var(--admin-border)] text-[var(--admin-text-3)] hover:text-[var(--admin-text)] transition-all">
                         <MoreHorizontal size={16} />
                      </button>
                   </div>
                 </div>
               ))}
            </div>
            <div className="p-8 bg-gradient-to-br from-[var(--admin-surface-2)] to-[var(--admin-bg)]/5 border-t border-[var(--admin-border)]">
               <div className="flex items-center justify-between mb-4">
                  <div className="text-[12px] font-black text-[var(--admin-text)] uppercase tracking-widest">Autonomous Syncing</div>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[var(--admin-green)] animate-pulse shadow-[0_0_8px_var(--admin-green)]" />
                     <span className="text-[10px] font-black text-[var(--admin-green)] uppercase tracking-widest">Live Optimization</span>
                  </div>
               </div>
               <div className="h-1.5 w-full bg-[var(--admin-surface-3)] rounded-full overflow-hidden p-0.5 border border-[var(--admin-border)] shadow-inner">
                  <div className="h-full bg-gradient-to-r from-[var(--admin-blue)] to-[var(--admin-accent)] rounded-full animate-progress" style={{ width: '65%' }} />
               </div>
               <div className="flex justify-between items-center mt-3">
                  <span className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-tight">Active Process: Asset_Refactor_Q3</span>
                  <span className="text-[9px] font-black text-[var(--admin-text-3)] uppercase tracking-tight">ETA: 4.2m</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
