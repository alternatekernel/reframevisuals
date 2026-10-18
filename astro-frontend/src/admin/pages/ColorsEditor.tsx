import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const ColorsEditor: React.FC = () => {
  const [colors, setColors] = useState({
    brand: '#E97451',
    brandHover: '#D66140',
    surface: '#FFFFFF',
    onyx: '#0A0A0B',
    categoryFoundation: '#E97451',
    categoryEnhancement: '#E07A5F',
    categoryRetouch: '#3D8B7A',
    categoryAdvanced: '#D4A843',
  });

  const colorFields = [
    { key: 'brand', label: 'Brand Color', description: 'Primary brand color for CTAs and accents' },
    { key: 'brandHover', label: 'Brand Hover', description: 'Hover state for brand color' },
    { key: 'surface', label: 'Surface', description: 'Background surface color' },
    { key: 'onyx', label: 'Onyx', description: 'Dark text and UI elements' },
    { key: 'categoryFoundation', label: 'Foundation', description: 'Foundation category color' },
    { key: 'categoryEnhancement', label: 'Enhancement', description: 'Enhancement category color' },
    { key: 'categoryRetouch', label: 'Retouch', description: 'Retouch category color' },
    { key: 'categoryAdvanced', label: 'Advanced', description: 'Advanced category color' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#37352F] mb-1" style={{ letterSpacing: '-0.02em' }}>
            Colors
          </h1>
          <p className="text-[14px] text-[#9B9A97]">Customize your brand and category colors</p>
        </div>
        <button className="px-4 py-2 bg-[#37352F] text-white text-[15px] font-medium rounded hover:bg-[#1F1E1B] transition-colors flex items-center gap-2">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colorFields.map((field) => (
          <div
            key={field.key}
            className="p-5 rounded border border-[#EDECE9] bg-white"
          >
            <div className="mb-3">
              <h3 className="text-[14px] font-semibold text-[#37352F] mb-1">{field.label}</h3>
              <p className="text-[14px] text-[#9B9A97]">{field.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={colors[field.key as keyof typeof colors]}
                  onChange={(e) => setColors({ ...colors, [field.key]: e.target.value })}
                  className="w-12 h-12 rounded border border-[#EDECE9] cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={colors[field.key as keyof typeof colors]}
                onChange={(e) => setColors({ ...colors, [field.key]: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#F7F6F3] border border-[#EDECE9] rounded text-[15px] font-mono focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-black/5"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="mt-6 p-6 rounded border border-[#EDECE9] bg-[#F7F6F3]">
        <h3 className="text-[14px] font-semibold text-[#37352F] mb-4">Preview</h3>
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 text-white text-[15px] font-medium rounded"
            style={{ backgroundColor: colors.brand }}
          >
            Primary Button
          </button>
          <button
            className="px-4 py-2 text-white text-[15px] font-medium rounded"
            style={{ backgroundColor: colors.brandHover }}
          >
            Hover State
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.categoryFoundation }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.categoryEnhancement }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.categoryRetouch }} />
            <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.categoryAdvanced }} />
          </div>
        </div>
      </div>
    </div>
  );
};
