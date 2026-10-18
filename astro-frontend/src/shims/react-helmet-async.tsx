import React, { createContext, useContext } from 'react';

export type HeadCollector = { title?: string; description?: string };
export const HeadCollectorCtx = createContext<HeadCollector | null>(null);

const text = (node: React.ReactNode): string =>
  React.Children.toArray(node).map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : '')).join('');

// Astro's layout owns <title>/<meta>/<link>. Helmet only (a) feeds a build-time collector and (b) keeps JSON-LD scripts in place.
export const Helmet: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const collector = useContext(HeadCollectorCtx);
  const kids = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  if (collector) {
    for (const el of kids) {
      if (el.type === 'title') collector.title = text(el.props.children);
      if (el.type === 'meta' && el.props.name === 'description') collector.description = el.props.content;
    }
  }
  return <>{kids.filter((el) => el.type === 'script')}</>;
};
export const HelmetProvider: React.FC<{ children?: React.ReactNode; context?: unknown }> = ({ children }) => <>{children}</>;
