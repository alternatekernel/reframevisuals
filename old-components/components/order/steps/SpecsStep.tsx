import React, { useState } from 'react';
import { OrderFlowData } from '../types';
import { OrderLabel, OrderTextInput, orderChoiceClass, orderFooterClass, orderPrimaryButtonClass, orderSecondaryButtonClass } from '../flow-controls';

interface Props {
  orderData: OrderFlowData;
  setOrderData: React.Dispatch<React.SetStateAction<OrderFlowData>>;
  onNext: () => void;
  onBack: () => void;
}

/* ── Pill-style option groups ── */

const FORMAT_OPTIONS = ['JPG', 'PNG', 'WEBP', 'TIFF', 'Other'];
const PROFILE_OPTIONS = ['Original', 'sRGB', 'Adobe', 'CMYK', 'Other'];
const DPI_OPTIONS = ['Original', '72', '150', '300', '600', 'Other'];
const BG_OPTIONS = ['White', 'Transparent', 'Original', 'Custom'];

const TURNAROUND_OPTIONS = [
  { value: '12', label: '12h', color: 'var(--research-peach)' },
  { value: '24', label: '24h', color: '#999' },
  { value: '48', label: '48h', color: '#999' },
  { value: '72', label: '72h', color: '#999' },
];

/* ── Reusable Pill Toggle ── */

const PillGroup: React.FC<{
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="space-y-1.5">
    <OrderLabel>{label}</OrderLabel>
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const isActive = value.toLowerCase() === opt.toLowerCase() || (value.toLowerCase() === 'custom' && opt.toLowerCase() === 'other');
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt.toLowerCase() === 'other' ? 'Custom' : opt.toLowerCase())}
            className={orderChoiceClass(isActive)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

/* ── Main Component ── */

const SpecsStep: React.FC<Props> = ({ orderData, setOrderData, onNext, onBack }) => {
  const [customFormat, setCustomFormat] = useState(
    FORMAT_OPTIONS.map(f => f.toLowerCase()).includes(orderData.outputFormat?.toLowerCase()) ? '' : orderData.outputFormat
  );
  const [customProfile, setCustomProfile] = useState(
    ['original', 'srgb', 'adobe', 'adobe rgb', 'cmyk'].includes(orderData.colorProfile?.toLowerCase()) ? '' : orderData.colorProfile
  );
  const [customDPI, setCustomDPI] = useState(
    DPI_OPTIONS.map(d => d.toLowerCase()).includes(orderData.resolutionDPI?.toLowerCase()) ? '' : orderData.resolutionDPI
  );
  const lockRatio = orderData.maintainAspectRatio !== false;

  const setField = (field: keyof OrderFlowData, value: string) =>
    setOrderData(prev => ({ ...prev, [field]: value }));

  // Map stored values back to display format for matching
  const getFormatDisplay = () => {
    const v = orderData.outputFormat?.toLowerCase();
    if (FORMAT_OPTIONS.map(f => f.toLowerCase()).includes(v)) return v;
    return 'custom';
  };

  const getProfileDisplay = () => {
    const v = orderData.colorProfile?.toLowerCase();
    if (['original', 'srgb', 'adobe', 'adobe rgb', 'cmyk'].includes(v)) return v === 'adobe rgb' ? 'adobe' : v;
    return 'custom';
  };

  const getBgDisplay = () => {
    const v = orderData.background?.toLowerCase();
    const map: Record<string, string> = { white: 'white', transparent: 'transparent', original: 'original', custom: 'custom' };
    return map[v] || 'white';
  };

  const bgFromPill = (pill: string) => {
    const map: Record<string, string> = { white: 'white', transparent: 'transparent', original: 'original', custom: 'custom' };
    return map[pill.toLowerCase()] || pill;
  };

  const profileFromPill = (pill: string) => {
    if (pill.toLowerCase() === 'adobe') return 'Adobe RGB';
    return pill;
  };

  return (
    <div className="flex flex-col flex-1 px-2 sm:px-3 py-2 sm:py-3 space-y-4 min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pr-1">
        <p className="text-caption font-medium text-[var(--color-text-primary)] mb-1">Technical Specs</p>

        {/* Row 1: Delivery Format + Color Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PillGroup
            label="Delivery Format"
            options={FORMAT_OPTIONS}
            value={getFormatDisplay()}
            onChange={(v) => setField('outputFormat', v)}
          />
          <PillGroup
            label="Color Profile"
            options={PROFILE_OPTIONS}
            value={getProfileDisplay()}
            onChange={(v) => setField('colorProfile', profileFromPill(v))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {getFormatDisplay() === 'custom' && (
            <div className="space-y-1">
              <span className="text-caption text-[var(--color-text-muted)] font-normal">Custom Format</span>
              <OrderTextInput
                type="text"
                value={customFormat}
                onChange={(e) => {
                  setCustomFormat(e.target.value);
                  setField('outputFormat', e.target.value || 'Custom');
                }}
                placeholder="e.g. PSD, AVIF"
                className="px-2.5 py-1.5 text-caption"
              />
            </div>
          )}
          {getProfileDisplay() === 'custom' && (
            <div className="space-y-1">
              <span className="text-caption text-[var(--color-text-muted)] font-normal">Custom Color Profile</span>
              <OrderTextInput
                type="text"
                value={customProfile}
                onChange={(e) => {
                  setCustomProfile(e.target.value);
                  setField('colorProfile', e.target.value || 'Custom');
                }}
                placeholder="e.g. Display P3"
                className="px-2.5 py-1.5 text-caption"
              />
            </div>
          )}
        </div>

        {/* Row 2: Resolution DPI + Background */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PillGroup
            label="Resolution (DPI)"
            options={DPI_OPTIONS}
            value={DPI_OPTIONS.map(d => d.toLowerCase()).includes(orderData.resolutionDPI?.toLowerCase()) ? orderData.resolutionDPI?.toLowerCase() : 'custom'}
            onChange={(v) => setField('resolutionDPI', v)}
          />
          <PillGroup
            label="Background"
            options={BG_OPTIONS}
            value={getBgDisplay()}
            onChange={(v) => setField('background', bgFromPill(v))}
          />
        </div>

        {/* Custom Background Controls */}
        {orderData.background === 'custom' && (
          <div className="p-3 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-caption text-[var(--color-text-muted)] font-normal block mb-1">Color</span>
                <input
                  type="color"
                  value={orderData.customBgColor || '#ffffff'}
                  onChange={(e) => setOrderData(prev => ({ ...prev, customBgColor: e.target.value }))}
                  className="w-full h-8 rounded cursor-pointer border border-[var(--color-border-light)] focus:outline-none focus:border-[var(--research-blue)] focus:ring-1 focus:ring-[var(--research-blue)]/10 transition-[border-color,box-shadow] duration-200"
                />
              </div>
              <div className="flex-1">
                <span className="text-caption text-[var(--color-text-muted)] font-normal block mb-1">Hex</span>
                <OrderTextInput
                  type="text"
                  value={orderData.customBgColor || '#ffffff'}
                  onChange={(e) => setOrderData(prev => ({ ...prev, customBgColor: e.target.value }))}
                  placeholder="#ffffff"
                  className="px-2 py-1.5 text-caption rounded"
                />
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-dashed border-[var(--color-border-light)] bg-white cursor-pointer hover:border-[var(--color-text-secondary)] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setOrderData(prev => ({ ...prev, customBgFile: file, customBgImage: file }));
                  }
                }}
                className="hidden"
              />
              <span className="text-caption text-[var(--color-text-secondary)] truncate">
                {orderData.customBgFile?.name || orderData.customBgImage?.name || 'Upload custom background image'}
              </span>
              <span className="text-caption font-semibold text-[var(--color-text-primary)]">Choose</span>
            </label>
          </div>
        )}

        {/* Custom DPI input */}
        {orderData.resolutionDPI?.toLowerCase() === 'custom' && (
          <div className="space-y-1">
            <span className="text-caption text-[var(--color-text-muted)] font-normal">Custom DPI</span>
            <OrderTextInput
              type="number"
              value={customDPI}
              onChange={(e) => {
                setCustomDPI(e.target.value);
                setField('resolutionDPI', e.target.value || 'Custom');
              }}
              placeholder="e.g. 400"
              className="w-32 px-2.5 py-1.5 text-caption"
            />
          </div>
        )}

        {/* Resize Row */}
        <div className="space-y-1.5">
          <OrderLabel>Resize</OrderLabel>
          <div className="flex items-center gap-2">
            <OrderTextInput
              type="number"
              value={orderData.resizeWidth}
              onChange={(e) => {
                const w = e.target.value;
                setOrderData(prev => ({
                  ...prev,
                  resizeWidth: w,
                  ...(lockRatio && prev.resizeWidth && prev.resizeHeight
                    ? { resizeHeight: String(Math.round((Number(w) / Number(prev.resizeWidth)) * Number(prev.resizeHeight))) }
                    : {}),
                }));
              }}
              placeholder="W"
              className="w-16 px-2 py-1.5 text-caption rounded-md text-center"
            />
            <span className="text-caption text-[var(--color-text-muted)]">×</span>
            <OrderTextInput
              type="number"
              value={orderData.resizeHeight}
              onChange={(e) => {
                const h = e.target.value;
                setOrderData(prev => ({
                  ...prev,
                  resizeHeight: h,
                  ...(lockRatio && prev.resizeWidth && prev.resizeHeight
                    ? { resizeWidth: String(Math.round((Number(h) / Number(prev.resizeHeight)) * Number(prev.resizeWidth))) }
                    : {}),
                }));
              }}
              placeholder="H"
              className="w-16 px-2 py-1.5 text-caption rounded-md text-center"
            />
            <span className="text-caption text-[var(--color-text-muted)]">px</span>
          </div>
        </div>

        {/* Turnaround Time */}
        <div className="space-y-1.5">
          <OrderLabel>Turnaround Time</OrderLabel>
          <div className="flex flex-wrap gap-1.5">
            {TURNAROUND_OPTIONS.map(tat => {
              const isActive = orderData.turnaround === tat.value;
              return (
                <button
                  key={tat.value}
                  type="button"
                  onClick={() => setField('turnaround', tat.value)}
                  className={orderChoiceClass(isActive)}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isActive ? '#fff' : tat.color }}
                  />
                  {tat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadline — turnaround alone could not express "I need it by this date",
            and there was no way for a client to state one anywhere in the flow. */}
        <div className="space-y-1.5">
          <OrderLabel>Deadline (optional)</OrderLabel>
          <input
            type="date"
            value={orderData.deadline || ''}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setField('deadline', e.target.value)}
            aria-label="Requested delivery date"
            className="w-full px-2.5 py-2 text-[12px] border border-[#e5e5e5] rounded-lg bg-white focus:outline-none focus:border-[var(--research-blue)] focus:ring-2 focus:ring-[var(--research-blue)]/10 transition-all"
          />
          <p className="text-caption text-[var(--color-text-muted)]">
            We will confirm if the date is not achievable for this volume.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={orderFooterClass}>
        <button
          onClick={onBack}
          className={orderSecondaryButtonClass}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className={orderPrimaryButtonClass}
        >
          Review Order
        </button>
      </div>
    </div>
  );
};

export default SpecsStep;
