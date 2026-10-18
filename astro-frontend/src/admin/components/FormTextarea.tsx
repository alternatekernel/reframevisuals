import React from 'react';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  id?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({ label, value, onChange, rows = 2, placeholder, id }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-3">
      <label htmlFor={inputId} className="an-field-label">{label}</label>
      <textarea
        id={inputId}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="an-input"
        style={{ height: 'auto', padding: '8px 12px', resize: 'vertical', lineHeight: '1.5' }}
      />
    </div>
  );
};
