import React, { useState } from 'react';
import { Save } from 'lucide-react';

export const FontsEditor: React.FC = () => {
  const [fonts, setFonts] = useState({
    heading: 'Inter',
    body: 'Inter',
    mono: 'JetBrains Mono',
  });

  const fontOptions = [
    'Inter',
    'SF Pro Display',
    'Roboto',
    'Poppins',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Source Sans Pro',
  ];

  const monoOptions = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Roboto Mono',
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-bold text-[#37352F] mb-1" style={{ letterSpacing: '-0.02em' }}>
            Fonts
          </h1>
          <p className="text-[14px] text-[#9B9A97]">Select fonts for your website</p>
        </div>
        <button className="px-4 py-2 bg-[#37352F] text-white text-[15px] font-medium rounded hover:bg-[#1F1E1B] transition-colors flex items-center gap-2">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      {/* Font Selection */}
      <div className="space-y-4">
        {/* Heading Font */}
        <div className="p-5 rounded border border-[#EDECE9] bg-white">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-[#37352F] mb-1">Heading Font</h3>
            <p className="text-[14px] text-[#9B9A97]">Used for H1, H2, H3, and other headings</p>
          </div>
          <select
            value={fonts.heading}
            onChange={(e) => setFonts({ ...fonts, heading: e.target.value })}
            className="w-full px-3 py-2 bg-[#F7F6F3] border border-[#EDECE9] rounded text-[15px] focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-black/5"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
          <div className="mt-4 p-4 bg-[#F7F6F3] rounded">
            <p className="text-[24px] font-bold" style={{ fontFamily: fonts.heading }}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>

        {/* Body Font */}
        <div className="p-5 rounded border border-[#EDECE9] bg-white">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-[#37352F] mb-1">Body Font</h3>
            <p className="text-[14px] text-[#9B9A97]">Used for paragraphs and body text</p>
          </div>
          <select
            value={fonts.body}
            onChange={(e) => setFonts({ ...fonts, body: e.target.value })}
            className="w-full px-3 py-2 bg-[#F7F6F3] border border-[#EDECE9] rounded text-[15px] focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-black/5"
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
          <div className="mt-4 p-4 bg-[#F7F6F3] rounded">
            <p className="text-[14px]" style={{ fontFamily: fonts.body, lineHeight: 1.6 }}>
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. 
              How vexingly quick daft zebras jump! The five boxing wizards jump quickly.
            </p>
          </div>
        </div>

        {/* Mono Font */}
        <div className="p-5 rounded border border-[#EDECE9] bg-white">
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-[#37352F] mb-1">Monospace Font</h3>
            <p className="text-[14px] text-[#9B9A97]">Used for code blocks and technical content</p>
          </div>
          <select
            value={fonts.mono}
            onChange={(e) => setFonts({ ...fonts, mono: e.target.value })}
            className="w-full px-3 py-2 bg-[#F7F6F3] border border-[#EDECE9] rounded text-[15px] focus:outline-none focus:border-[#37352F] focus:ring-1 focus:ring-black/5"
          >
            {monoOptions.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
          <div className="mt-4 p-4 bg-[#F7F6F3] rounded">
            <code className="text-[15px]" style={{ fontFamily: fonts.mono }}>
              const greeting = "Hello, World!";<br />
              return greeting;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
