import * as React from 'react';
import { cx } from '../../utils/theme';

export const orderText = {
  primary: 'text-[var(--color-text-primary)]',
  secondary: 'text-[var(--color-text-secondary)]',
  muted: 'text-[var(--color-text-muted)]',
  border: 'border-[var(--color-border-light)]',
  panel: 'bg-[var(--color-bg-secondary)]',
};

export const OrderLabel = ({ className, children }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cx('text-caption font-heading font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)] opacity-80', className)}>
    {children}
  </span>
);

export const OrderFieldLabel = ({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cx('text-caption font-medium text-[var(--color-text-primary)] mb-2', className)}>
    {children}
  </p>
);

export const orderInputClass = 'rounded-lg px-3 py-2 text-caption border border-[var(--color-border-light)] bg-white focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-[border-color,box-shadow] duration-200';

export const OrderTextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cx(className?.includes('w-') ? '' : 'w-full', orderInputClass, className)} {...props} />
  )
);
OrderTextInput.displayName = 'OrderTextInput';

export const OrderTextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cx(className?.includes('w-') ? '' : 'w-full', orderInputClass, className)} {...props} />
  )
);
OrderTextArea.displayName = 'OrderTextArea';

export const orderChoiceClass = (isActive: boolean) => cx(
  'h-8 px-3.5 rounded-md text-caption font-medium tracking-wide flex items-center justify-center gap-2 border transition-[background-color,border-color,color,box-shadow,transform] duration-150',
  isActive
    ? 'bg-[var(--color-text-primary)] text-white border-transparent shadow-sm'
    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-border-light)]'
);

export const orderFooterClass = 'flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-border-subtle)]';

export const orderSecondaryButtonClass = 'h-9 px-4 flex items-center justify-center rounded-lg border border-[var(--color-border-light)] text-caption font-heading font-black uppercase tracking-wider text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-200';

export const orderPrimaryButtonClass = 'h-9 px-5 flex items-center justify-center rounded-lg bg-[var(--color-text-primary)] text-white text-caption font-heading font-black uppercase tracking-wider disabled:opacity-50 shadow-sm transition-colors duration-200 hover:bg-black';
