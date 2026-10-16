import React from 'react';

interface FormColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export const FormColor: React.FC<FormColorProps> = ({ label, value, onChange, id }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-3">
      <label htmlFor={inputId} className="block text-[14px] font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-md border-0 cursor-pointer p-0 flex-shrink-0"
        />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 h-8 border border-gray-200 rounded-md px-2.5 text-[14px] font-mono text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};
