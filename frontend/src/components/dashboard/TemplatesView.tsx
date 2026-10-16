import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { layout } from '../../utils/theme';
import { Plus, Trash2, Edit3, Zap, Copy, FileJson, Check, Info } from 'lucide-react';
import { OrderTemplate } from '../../types/dashboard';
import { SERVICES } from '../../data/services';
import { useNavigate } from 'react-router-dom';

const serviceLabel = (id: string) => SERVICES.find(service => service.id === id)?.name || id;

const TemplatesView = () => {
  const { templates, deleteTemplate, setCurrentView, setIsTemplateMode } = useDashboard();
  const navigate = useNavigate();

  const handleCreateNew = () => {
    setIsTemplateMode(true);
    setCurrentView('orderFlow');
  };

  const useTemplate = (t: OrderTemplate) => {
    // Navigate to orderFlow and pass the template ID
    setIsTemplateMode(false);
    navigate('/dashboard?view=new-project&template=' + t.id);
    setCurrentView('orderFlow');
  };

  const startEdit = (t: OrderTemplate) => {
    // For editing, we'd also want to use the flow but pre-filled
    // Let's implement this by passing the template id as well
    setIsTemplateMode(true);
    navigate('/dashboard?view=new-project&template=' + t.id);
    setCurrentView('orderFlow');
  };

  return (
    <div className={layout.compactShell}>
      <header className="flex items-end justify-between border-b border-borderSubtle py-8">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary" style={{ letterSpacing: '-1.12px' }}>Project Templates</h1>
          <p className="mt-1 text-[14px] text-text-secondary">Standardize your workflow for one-click ordering</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 rounded-xl bg-brand-ink px-5 py-3 text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus size={16} />
          Create Template
        </button>
      </header>

      <div className="py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => (
          <div 
            key={t.id}
            className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-black/10 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black">
                <Copy size={20} strokeWidth={1.5} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(t)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => deleteTemplate(t.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <h3 className="mb-1 text-[16px] font-semibold text-text-primary">{t.name}</h3>
            <p className="text-[11px] text-gray-400 mb-4 uppercase tracking-widest font-bold">Created {t.createdAt}</p>

            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap gap-1.5">
                {t.services.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-[10px] font-semibold border border-gray-100">{serviceLabel(s)}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[12px] text-gray-500">
                <div className="flex items-center gap-1">
                  <FileJson size={12} />
                  {t.specs.format}
                </div>
                <div className="flex items-center gap-1">
                  <Check size={12} />
                  {t.specs.sizing}
                </div>
              </div>
            </div>

            <button 
              onClick={() => useTemplate(t)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-ink py-3 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Zap size={14} fill="currentColor" />
              Place One-Click Order
            </button>
          </div>
        ))}

        {/* Empty State / Add Card */}
        <button 
          onClick={handleCreateNew}
          className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-100 hover:border-black/10 hover:bg-gray-50 transition-all text-gray-400 gap-3 group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="text-[13px] font-medium">Create New Template</span>
        </button>
      </div>
    </div>
  );
};

export default TemplatesView;
