import * as React from 'react';
import { cx } from '../../utils/theme';

const fieldLabelClass = 'block text-[12px] font-semibold text-[var(--color-text-primary)]';
const fieldLabelCapsClass = 'block text-[12px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]';
const fieldControlClass = 'w-full rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-black/25 focus:border-[var(--color-text-primary)] focus:ring-1 focus:ring-black/5';

export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  caps?: boolean;
}

export const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, caps = false, ...props }, ref) => (
    <label
      ref={ref}
      className={cx(caps ? fieldLabelCapsClass : fieldLabelClass, className)}
      {...props}
    />
  ),
);
FieldLabel.displayName = 'FieldLabel';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cx('h-10', fieldControlClass, className)}
      {...props}
    />
  ),
);
TextInput.displayName = 'TextInput';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cx('resize-none py-2', fieldControlClass, className)}
      {...props}
    />
  ),
);
TextArea.displayName = 'TextArea';

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cx('h-10', fieldControlClass, className)}
      {...props}
    />
  ),
);
SelectInput.displayName = 'SelectInput';

export const publicInputClass = 'w-full border border-black/10 bg-white px-5 text-[15px] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--color-text-tertiary)] focus:border-black/25 focus:bg-white focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50';

export const publicPillInputClass = cx(publicInputClass, 'min-h-12 rounded-full py-3.5');
export const publicRoundedInputClass = cx(publicInputClass, 'min-h-11 rounded-xl py-3 shadow-sm');

export type PublicInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  shape?: 'pill' | 'rounded';
};

export const PublicInput = React.forwardRef<HTMLInputElement, PublicInputProps>(
  ({ className, shape = 'rounded', ...props }, ref) => (
    <input
      ref={ref}
      className={cx(shape === 'pill' ? publicPillInputClass : publicRoundedInputClass, className)}
      {...props}
    />
  ),
);
PublicInput.displayName = 'PublicInput';

export const publicInlineSubmitButtonClass = 'inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-[var(--color-text-primary)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-black active:scale-95 disabled:opacity-50';

export const formControls = {
  label: fieldLabelClass,
  labelCaps: fieldLabelCapsClass,
  control: fieldControlClass,
  publicInput: publicInputClass,
  publicPillInput: publicPillInputClass,
  publicRoundedInput: publicRoundedInputClass,
  publicInlineSubmitButton: publicInlineSubmitButtonClass,
};
