import React, { useState } from 'react';

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export const ListEditor: React.FC<ListEditorProps> = ({ label, items, onChange, placeholder = 'Add...' }) => {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) { onChange([...items, newItem.trim()]); setNewItem(''); }
  };
  const removeItem = (index: number) => { onChange(items.filter((_, i) => i !== index)); };
  const updateItem = (index: number, value: string) => { const c = [...items]; c[index] = value; onChange(c); };

  return (
    <div className="mb-3">
      <label className="block text-[14px] font-medium text-gray-600 mb-1">{label}</label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1 group">
            <input type="text" value={item} onChange={e => updateItem(i, e.target.value)}
              className="flex-1 h-7 border border-gray-200 rounded-md px-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10" />
            <button onClick={() => removeItem(i)} aria-label={`Remove ${item}`}
              className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder={placeholder} className="flex-1 h-7 border border-dashed border-gray-300 rounded-md px-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10" />
        <button onClick={addItem} className="h-7 px-2.5 bg-gray-100 text-gray-600 rounded-md text-[14px] font-medium hover:bg-gray-200">Add</button>
      </div>
    </div>
  );
};
