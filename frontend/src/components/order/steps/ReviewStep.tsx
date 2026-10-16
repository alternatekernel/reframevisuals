import React from 'react';
import { SERVICES } from '../../../data/services';
import { OrderFlowData } from '../types';
import { orderFooterClass, orderPrimaryButtonClass, orderSecondaryButtonClass } from '../flow-controls';
import { calculateOrderVolume } from '../../../utils/orderVolume';

interface Props {
  orderData: OrderFlowData;
  isSubmitting: boolean;
  error?: string | null;
  isTemplateMode?: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const ReviewStep: React.FC<Props> = ({ orderData, isSubmitting, error, isTemplateMode, onSubmit, onBack }) => {
  const totalVolume = calculateOrderVolume(orderData);
  const workFileCount = orderData.customFilesLink
    ? totalVolume
    : orderData.files.filter(f => f.type.startsWith('image/')).length;
  const supportFileCount = orderData.customFilesLink ? 0 : orderData.files.length - workFileCount;
  const sourceLinkCount = (orderData.sourceLinks || []).length;
  const serviceNames = orderData.selectedServices
    .map(id => SERVICES.find(s => s.id === id)?.name || id)
    .filter(Boolean);
  const resizeLabel = orderData.resizeWidth || orderData.resizeHeight
    ? `${orderData.resizeWidth || 'auto'}×${orderData.resizeHeight || 'auto'}px${orderData.maintainAspectRatio !== false ? ' locked' : ''}`
    : 'Original';
  const backgroundLabel = orderData.background === 'custom'
    ? `Custom${orderData.customBgColor ? ` (${orderData.customBgColor})` : ''}${orderData.customBgFile?.name || orderData.customBgImage?.name ? ' + image' : ''}`
    : orderData.background;



  return (
    <div className="flex flex-col flex-1 space-y-3 px-2 sm:px-3 py-2 sm:py-3 min-h-0">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-caption font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
        <div className="p-4 bg-white border border-[var(--color-border-subtle)] rounded-xl">
          <p className="text-caption font-bold text-[var(--color-text-primary)] mb-3">Order Summary</p>

          <div className="space-y-1.5 text-caption text-left">
            <div className="flex justify-between py-1.5 border-b border-black/5">
              <span className="text-[var(--color-text-secondary)]">Selected Services:</span>
              <span className="text-[var(--color-text-primary)] font-normal text-right max-w-[60%]">
                {serviceNames.join(', ')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-black/5">
              <span className="text-[var(--color-text-secondary)]">Volume:</span>
              <span className="text-[var(--color-text-primary)] text-right">
                {workFileCount} {orderData.customFilesLink ? 'images (via link)' : 'uploads'}
                {sourceLinkCount > 0 ? ` + ${sourceLinkCount} links` : ''}
                {supportFileCount > 0 ? ` + ${supportFileCount} references` : ''}
              </span>
            </div>
            {orderData.customFilesLink && (
              <div className="flex justify-between py-1.5 border-b border-black/5 flex-col sm:flex-row">
                <span className="text-[var(--color-text-secondary)]">Files Link:</span>
                <span className="text-[var(--color-text-primary)] text-right break-all max-w-full sm:max-w-[60%] font-medium text-blue-600 hover:underline">
                  <a href={orderData.customFilesLink} target="_blank" rel="noopener noreferrer">
                    {orderData.customFilesLink}
                  </a>
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-black/5">
              <span className="text-[var(--color-text-secondary)]">Format / DPI:</span>
              <span className="text-[var(--color-text-primary)] text-right">{orderData.outputFormat} / {orderData.resolutionDPI} DPI</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-black/5">
              <span className="text-[var(--color-text-secondary)]">Color / Background:</span>
              <span className="text-[var(--color-text-primary)] text-right max-w-[60%]">{orderData.colorProfile} / {backgroundLabel}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-black/5">
              <span className="text-[var(--color-text-secondary)]">Resize:</span>
              <span className="text-[var(--color-text-primary)] text-right">{resizeLabel}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--color-text-secondary)]">Speed:</span>
              <span className="text-[var(--color-text-primary)]">{orderData.turnaround}h Delivery</span>
            </div>
          </div>

        </div>
      </div>

      <div className={orderFooterClass}>
        <button
          onClick={onBack}
          className={orderSecondaryButtonClass}
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`${orderPrimaryButtonClass} px-6 shadow-lg shadow-black/10`}
        >
          {isSubmitting ? 'Processing...' : (isTemplateMode ? '✓ Save Template' : '✓ Confirm Order')}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
