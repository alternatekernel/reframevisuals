import React from 'react';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'url' | 'email' | 'password' | 'number';
  placeholder?: string;
  id?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', placeholder, id }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-3">
      <label htmlFor={inputId} className="an-field-label">{label}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="an-input"
      />
    </div>
  );
};
