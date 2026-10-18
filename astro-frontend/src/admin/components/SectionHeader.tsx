import React from 'react';

interface SectionHeaderProps {
  title: string;
  description: string;
  parentPage?: string;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, parentPage, actions }) => (
  <div className="mb-8 flex items-end justify-between gap-4">
    <div className="flex-1">
      <h1 className="an-page-title" style={{ marginBottom: 0 }}>
        {title}
      </h1>
      <p className="an-page-desc" style={{ marginTop: '6px', maxWidth: '640px', lineHeight: 1.55 }}>
        {description}
      </p>
      {parentPage && (
        <div className="mt-3 flex items-center gap-2">
          <span style={{ fontSize: 'var(--an-text-2xs)', textTransform: 'uppercase', fontWeight: 700, color: 'var(--an-text3)', letterSpacing: '0.08em' }}>Context</span>
          <span style={{
            fontSize: 'var(--an-text-xs)',
            fontFamily: 'var(--an-font)',
            background: 'var(--an-sidebar)',
            border: '1px solid var(--an-border)',
            padding: '2px 8px',
            borderRadius: 'var(--an-r-sm)',
            color: 'var(--an-text2)',
          }}>
            {parentPage}
          </span>
        </div>
      )}
    </div>
    {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
  </div>
);
