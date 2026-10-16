import React from 'react';
import { SERVICES } from '../../../data/services';
import { OrderFlowData } from '../types';
import { OrderFieldLabel, OrderTextArea, OrderTextInput, orderFooterClass, orderPrimaryButtonClass, orderSecondaryButtonClass } from '../flow-controls';

interface Props {
  orderData: OrderFlowData;
  setOrderData: React.Dispatch<React.SetStateAction<OrderFlowData>>;
  isTemplateMode?: boolean;
  onNext: () => void;
  onCancel: () => void;
}

const serviceList = SERVICES.filter(
  s => !['marketplace-ready', 'ghost-mannequin-complete', 'jewelry-essentials'].includes(s.id)
);

const RequirementsStep: React.FC<Props> = ({ orderData, setOrderData, isTemplateMode, onNext, onCancel }) => {
  return (
    <div className="flex flex-col flex-1 px-2 sm:px-3 py-2 sm:py-3 min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 sm:space-y-3 pr-1">
        <OrderFieldLabel>
          {isTemplateMode ? 'Template Name' : 'Project Name'}
        </OrderFieldLabel>
        <OrderTextInput
          type="text"
          value={orderData.projectName}
          onChange={e => setOrderData(prev => ({ ...prev, projectName: e.target.value }))}
          placeholder={isTemplateMode ? "e.g. Standard Web Crop" : "e.g. Summer Collection 2026"}
          className="mb-4"
        />

        <OrderFieldLabel>Pick services</OrderFieldLabel>

        <div className="flex flex-wrap gap-2 mb-4">
          {serviceList.map(service => {
            const IconComponent = service.icon;
            const isSelected = orderData.selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() =>
                  setOrderData(prev => ({
                    ...prev,
                    selectedServices: isSelected
                      ? prev.selectedServices.filter(id => id !== service.id)
                      : [...prev.selectedServices, service.id],
                  }))
                }
                className={`h-8 px-4 rounded-full text-caption font-medium transition-[background-color,border-color,color,box-shadow] duration-150 flex items-center justify-center gap-2 border shadow-sm ${
                  isSelected
                    ? 'bg-[var(--color-text-primary)] text-white border-transparent shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-light)] text-[var(--color-text-primary)] hover:bg-white'
                }`}
              >
                <IconComponent
                  size={14}
                  className={isSelected ? 'text-white' : 'text-[var(--color-text-primary)]/60'}
                  strokeWidth={2.5}
                />
                <span>{service.name}</span>
              </button>
            );
          })}
        </div>

        <OrderFieldLabel className="mt-4">Project Instructions</OrderFieldLabel>
        <OrderTextArea
          value={orderData.instructions}
          onChange={e => {
            setOrderData(prev => ({ ...prev, instructions: e.target.value }));
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder="Detail your requirements here..."
          className="min-h-[160px] max-h-[480px] resize-y bg-[var(--color-bg-secondary)]"
          style={{ minHeight: '160px', maxHeight: '480px' }}
        />
      </div>

      <div className={orderFooterClass}>
        <button
          onClick={onCancel}
          className={orderSecondaryButtonClass}
        >
          Close
        </button>
        <button
          onClick={onNext}
          disabled={orderData.selectedServices.length === 0}
          className={orderPrimaryButtonClass}
        >
          Next: Upload Files
        </button>
      </div>
    </div>
  );
};

export default RequirementsStep;
