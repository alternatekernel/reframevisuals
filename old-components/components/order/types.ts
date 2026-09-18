export interface OrderFlowData {
  projectName: string;
  instructions: string;
  selectedServices: string[];
  outputFormat: string;
  turnaround: string;
  /** Client's requested delivery date (YYYY-MM-DD). Maps to Order.expectedCompletion. */
  deadline?: string;
  files: File[];
  supportFiles: File[];
  sourceLinks: string[];
  background: string;
  customBgFile?: File;
  customBgColor?: string;
  customBgImage?: File;
  cropRatio: string;
  resizeWidth: string;
  resizeHeight: string;
  colorProfile: string;
  resolutionDPI: string;
  layering: string;
  namingPattern: string;
  marginPercent: string;
  deliveryVector: string;
  maintainAspectRatio?: boolean;
  sourceTemplateId?: string;
  customFilesLink?: string;
  customFilesCount?: number;
  idempotencyKey?: string;
  email: string;
}

export type OrderFlowStep = 'requirements' | 'files' | 'specs' | 'review' | 'complete';

export const SELECT_CLASS =
  'w-full px-2.5 py-2 pr-8 text-[12px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-all appearance-none';
