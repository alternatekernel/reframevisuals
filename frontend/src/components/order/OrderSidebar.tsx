import React from 'react';
import { Check } from 'lucide-react';
import { OrderFlowData, OrderFlowStep } from './types';
import { SERVICES } from '../../data/services';

const STEPS: { id: OrderFlowStep; label: string }[] = [
  { id: 'requirements', label: 'What you need' },
  { id: 'files', label: 'Upload files' },
  { id: 'specs', label: 'Specs' },
  { id: 'review', label: 'Review' },
];

const STEP_ORDER: OrderFlowStep[] = ['requirements', 'files', 'specs', 'review'];

interface OrderSidebarProps {
  orderFlowStep: OrderFlowStep;
  orderData: OrderFlowData;
  onStepClick: (step: OrderFlowStep) => void;
}

const SumRow: React.FC<{ label: string; value: string; valueClass?: string }> = ({
  label,
  value,
  valueClass,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[9px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-muted)]">{label}</span>
    <span className={`text-[11px] font-medium leading-snug break-words ${valueClass ?? 'text-[var(--color-text-secondary)]'}`}>
      {value}
    </span>
  </div>
);

const OrderSidebar: React.FC<OrderSidebarProps> = ({ orderFlowStep, orderData, onStepClick }) => {
  const currentIdx = STEP_ORDER.indexOf(orderFlowStep);
  const allDone = currentIdx === -1; // 'complete' state

  const serviceNames = (orderData.selectedServices ?? []).map(
    id => SERVICES.find(s => s.id === id)?.name ?? id,
  );

  const fmt = (orderData.outputFormat ?? 'jpg').toUpperCase();
  const dpi = orderData.resolutionDPI ?? '72';
  const bg = orderData.background
    ? orderData.background.charAt(0).toUpperCase() + orderData.background.slice(1)
    : 'White';
  const profile = orderData.colorProfile ?? 'sRGB';
  const turnaround = orderData.turnaround ? `${orderData.turnaround}h` : '24h';
  const resize =
    orderData.resizeWidth || orderData.resizeHeight
      ? `${orderData.resizeWidth || 'auto'}×${orderData.resizeHeight || 'auto'}px`
      : 'Original';

  const fileCount = (orderData.files ?? []).filter(f => f.type.startsWith('image/')).length;
  const linkCount = (orderData.sourceLinks ?? []).length;
  const filesDisplay = orderData.customFilesLink
    ? 'Via folder link'
    : fileCount > 0
    ? `${fileCount} uploaded${linkCount > 0 ? ` + ${linkCount} links` : ''}`
    : linkCount > 0
    ? `${linkCount} link${linkCount !== 1 ? 's' : ''}`
    : '0 uploaded';

  const svcsDisplay =
    serviceNames.length === 0
      ? '—'
      : serviceNames.join(', ');

  return (
    <aside className="h-full flex flex-col overflow-y-auto">
      {/* Steps */}
      <div className="p-4 pb-0">
        <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--color-text-muted)] mb-3">
          Steps
        </p>
        <div className="flex flex-col gap-0.5">
          {STEPS.map((step, idx) => {
            const isDone = allDone || idx < currentIdx;
            const isCurrent = !allDone && idx === currentIdx;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick(step.id)}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors w-full ${
                  isCurrent
                    ? 'bg-[var(--color-bg-secondary)]'
                    : 'hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold transition-all ${
                    isDone
                      ? 'bg-[var(--color-text-primary)] text-white'
                      : isCurrent
                      ? 'border-[1.5px] border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                      : 'border border-[var(--color-border-light)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {isDone ? <Check size={9} strokeWidth={3} /> : idx + 1}
                </div>
                <span
                  className={`text-[12px] transition-colors ${
                    isCurrent
                      ? 'text-[var(--color-text-primary)] font-medium'
                      : isDone
                      ? 'text-[var(--color-text-muted)]'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 my-4 border-t border-[var(--color-border-light)]" />

      {/* Live summary */}
      <div className="px-4 pb-5 space-y-2.5 flex-1">
        <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--color-text-muted)] mb-3">
          Summary
        </p>
        <SumRow label="Project" value={orderData.projectName || '—'} />
        <SumRow label="Services" value={svcsDisplay} />
        <SumRow
          label="Files"
          value={filesDisplay}
          valueClass="text-[var(--color-text-secondary)]"
        />
        <SumRow label="Format" value={`${fmt} / ${dpi} DPI`} />
        <SumRow label="Background" value={`${bg} / ${profile}`} />
        <SumRow label="Resize" value={resize} />
        <SumRow label="Speed" value={`${turnaround} delivery`} />
      </div>
    </aside>
  );
};

export default OrderSidebar;
