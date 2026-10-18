import React from 'react';

interface FormNumberProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  id?: string;
}

export const FormNumber: React.FC<FormNumberProps> = ({ label, value, onChange, min, max, step = 1, suffix, id }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-3">
      <label htmlFor={inputId} className="block text-[14px] font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
        />
        {suffix && <span className="text-[14px] text-gray-400 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
};
