import React from 'react';

interface FormToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}

export const FormToggle: React.FC<FormToggleProps> = ({ label, value, onChange, id }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-3 flex items-center justify-between">
      <label htmlFor={inputId} style={{ fontSize: 'var(--an-text-md)', fontWeight: 500, color: 'var(--an-text)' }}>{label}</label>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          height: '20px',
          width: '36px',
          flexShrink: 0,
          cursor: 'pointer',
          borderRadius: '999px',
          border: 'none',
          transition: 'background 0.15s',
          background: value ? 'var(--an-text)' : 'var(--an-border2)',
          outline: 'none',
        }}
      >
        <span style={{
          pointerEvents: 'none',
          display: 'inline-block',
          height: '16px',
          width: '16px',
          transform: value ? 'translateX(16px)' : 'translateX(2px)',
          borderRadius: '50%',
          background: 'var(--an-page)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s',
          marginTop: '2px',
        }} />
      </button>
    </div>
  );
};
