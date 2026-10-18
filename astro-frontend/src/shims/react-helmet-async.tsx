import React from 'react';

// Astro's layout owns <title>/<meta>/<link>. Only JSON-LD scripts from Helmet are kept (rendered in place).
export const Helmet: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{React.Children.toArray(children).filter((c) => React.isValidElement(c) && (c as React.ReactElement).type === 'script')}</>
);
export const HelmetProvider: React.FC<{ children?: React.ReactNode; context?: unknown }> = ({ children }) => <>{children}</>;
