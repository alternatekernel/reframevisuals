import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  fullScreen = false,
}) => {
  const sizeClass = size === 'small' ? 'an-loading-sm' : size === 'large' ? 'an-loading-lg' : '';
  
  const spinner = (
    <div className={`an-loading ${sizeClass}`}>
      <div className="an-loading-spinner" />
      {text && <span>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="an-loading-overlay" style={{ position: 'fixed', inset: 0 }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="an-empty-state">
      {icon && <div className="an-empty-state-icon">{icon}</div>}
      {title && <div className="an-empty-state-title">{title}</div>}
      {description && <div className="an-empty-state-desc">{description}</div>}
      {action && <div>{action}</div>}
    </div>
  );
};
