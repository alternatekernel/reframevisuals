import React from 'react';
import { useContent } from '../../context/ContentBase';
import { FormNumber } from '../components/FormNumber';

export const TypographyEditor: React.FC = () => {
  const { theme, setTheme } = useContent();
  const updateTypography = (key: string, value: number) => {
    setTheme({ typography: { ...theme.typography, [key]: value } });
  };
  const updateRadius = (key: string, value: number) => {
    setTheme({ radius: { ...theme.radius, [key]: value } });
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">Typography & Spacing</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">Adjust text size, spacing, and corner roundness.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200/80 p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Text Size</h3>
        <div className="grid grid-cols-2 gap-x-4">
          <FormNumber label="Base Size" value={theme.typography.baseFontSize} onChange={v => updateTypography('baseFontSize', v)} min={12} max={24} suffix="px" />
          <FormNumber label="Heading Scale" value={theme.typography.headingScale} onChange={v => updateTypography('headingScale', v)} min={1} max={2} step={0.05} suffix="x" />
          <FormNumber label="Line Height" value={theme.typography.lineHeight} onChange={v => updateTypography('lineHeight', v)} min={1} max={2.5} step={0.1} />
          <FormNumber label="Letter Spacing" value={theme.typography.letterSpacing} onChange={v => updateTypography('letterSpacing', v)} min={-0.1} max={0.1} step={0.01} suffix="em" />
        </div>
        <div className="border-t border-gray-100 my-4" />
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Corner Roundness</h3>
        <div className="grid grid-cols-2 gap-x-4">
          <FormNumber label="Small (buttons)" value={theme.radius.sm} onChange={v => updateRadius('sm', v)} min={0} max={24} suffix="px" />
          <FormNumber label="Medium (cards)" value={theme.radius.md} onChange={v => updateRadius('md', v)} min={0} max={48} suffix="px" />
          <FormNumber label="Large (sections)" value={theme.radius.lg} onChange={v => updateRadius('lg', v)} min={0} max={96} suffix="px" />
          <FormNumber label="Extra Large" value={theme.radius.xl} onChange={v => updateRadius('xl', v)} min={0} max={128} suffix="px" />
        </div>
        <div className="border-t border-gray-100 my-4" />
        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Preview</h3>
        <div className="p-4 bg-gray-50 rounded-lg flex gap-3 items-center border border-gray-100">
          <div style={{ fontSize: `${theme.typography.baseFontSize}px`, fontFamily: `var(--font-heading)`, fontWeight: 700 }}>Heading</div>
          <div style={{ fontSize: `${theme.typography.baseFontSize}px` }}>Body text</div>
          <div className="bg-gray-900 text-white px-3 py-1.5 text-[14px] font-medium" style={{ borderRadius: `${theme.radius.sm}px` }}>Button</div>
          <div className="bg-white border border-gray-200 p-3 text-[14px]" style={{ borderRadius: `${theme.radius.md}px` }}>Card</div>
        </div>
      </div>
    </div>
  );
};
