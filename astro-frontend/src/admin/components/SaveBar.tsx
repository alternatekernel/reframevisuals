import React from 'react';

interface SaveBarProps {
  onSave: () => void;
  onReset: () => void;
  saved?: boolean;
}

export const SaveBar: React.FC<SaveBarProps> = ({ onSave, onReset, saved }) => (
  <div className="flex items-center gap-3 pt-6 mt-6" style={{ borderTop: '1px solid var(--an-border)' }}>
    <button onClick={onSave} className="an-btn an-btn-primary">
      Save Changes
    </button>
    <button onClick={onReset} className="an-btn an-btn-ghost">
      Reset to Default
    </button>
    {saved && (
      <span className="text-[14px] text-emerald-600 font-medium flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        Saved
      </span>
    )}
  </div>
);
