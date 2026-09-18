import * as React from 'react';
import { cx } from '../../utils/theme';

export const dashboardSurfaceClass = 'rounded-2xl border border-borderSubtle bg-white shadow-sm';
export const dashboardPanelClass = 'rounded-[32px] border border-dashed border-borderLight bg-bg-secondary';
export const dashboardInteractiveSurfaceClass = 'rounded-xl border border-borderSubtle bg-white shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200';
export const dashboardInputClass = 'w-full rounded-xl border border-borderLight bg-white px-4 py-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow] duration-200 focus:border-text-primary focus:ring-1 focus:ring-black/5';
export const dashboardInlineInputClass = 'flex-1 bg-transparent text-[14px] text-text-primary outline-none';
export const dashboardInlineFieldClass = 'flex items-center gap-3 rounded-xl border border-borderLight px-4 py-3 transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-text-primary focus-within:bg-white focus-within:ring-1 focus-within:ring-black/5';
export const dashboardLabelClass = 'mb-2 block text-[12px] font-medium uppercase tracking-widest text-text-secondary';
export const dashboardPrimaryButtonClass = 'inline-flex items-center justify-center rounded-lg bg-text-primary px-6 py-3 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-black disabled:opacity-50';
export const dashboardSecondaryButtonClass = 'inline-flex items-center justify-center rounded-lg border border-borderLight bg-white px-5 py-3 text-[14px] font-medium text-text-secondary transition-colors duration-200 hover:bg-bg-secondary disabled:opacity-50';
export const dashboardPageTitleClass = 'text-[28px] font-bold tracking-tight text-text-primary';
export const dashboardPageDescriptionClass = 'mt-1 text-[14px] text-text-secondary';
export const dashboardSectionTitleClass = 'mb-2 text-[20px] font-semibold text-text-primary';
export const dashboardSectionDescriptionClass = 'mb-6 text-[14px] text-text-secondary';
export const dashboardMetricLabelClass = 'text-[12px] font-medium uppercase tracking-widest text-text-muted';
export const dashboardMetricValueClass = 'mt-1 text-[28px] font-semibold text-text-primary';
export const dashboardChatComposerClass = 'max-w-4xl mx-auto flex flex-col rounded-[22px] border border-borderSubtle bg-white p-2 shadow-sm transition-[border-color,box-shadow] duration-300 focus-within:border-black/20 focus-within:shadow-md';
export const dashboardChatIconButtonClass = 'rounded-full p-2.5 text-text-secondary transition-colors hover:bg-black/5';
export const dashboardChatSecondaryPillClass = 'rounded-full border border-borderSubtle bg-white px-4 py-2 text-sm font-medium text-text-primary transition-all hover:bg-bg-secondary active:scale-[0.97]';
export const dashboardChatMenuClass = 'absolute right-6 top-16 z-40 w-60 rounded-xl border border-borderSubtle bg-white p-2 shadow-xl';
export const dashboardChatMenuItemClass = 'w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-text-primary hover:bg-bg-secondary';
export const dashboardChatMutedTextClass = 'text-text-muted';
export const dashboardChatBodyTextClass = 'text-text-secondary';

export function dashboardNoticeClass(type: 'success' | 'error') {
  return cx(
    'rounded-xl px-4 py-3 text-[13px]',
    type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
  );
}

export function DashboardSurface({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(dashboardSurfaceClass, className)} {...props} />;
}

export function DashboardFieldLabel({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx(dashboardLabelClass, className)} {...props} />;
}
