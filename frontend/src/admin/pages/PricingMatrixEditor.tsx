import React, { useState, useMemo } from 'react';
import { useContent } from '../../context/ContentBase';
import { SectionHeader } from '../components/SectionHeader';
import { SaveBar } from '../components/SaveBar';

export const PricingMatrixEditor: React.FC = () => {
  const { getSectionContent, setSectionContent, resetSection } = useContent();
  const [rows, setRows] = useState<any[]>(() => getSectionContent('pricingMatrix').rows || []);
  const [saved, setSaved] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const handleSave = () => {
    setSectionContent('pricingMatrix', { rows });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSection('pricingMatrix');
    const content = getSectionContent('pricingMatrix');
    setRows(content.rows || []);
  };

  // Transform flat rows → nested for display
  const services = useMemo(() => {
    const grouped: Record<string, { tiers: Record<string, { label: string; rowIdx: number }>; turnarounds: string[] }> = {};
    let currentService = '';
    const turnarounds = ['12h', '24h', '48h', '72h', '7d'];

    rows.forEach((row, idx) => {
      if (row.service) currentService = row.service;
      if (!currentService) return;

      if (!grouped[currentService]) {
        grouped[currentService] = { tiers: {}, turnarounds };
      }
      grouped[currentService].tiers[row.tier] = { label: row.tierLabel || row.tier, rowIdx: idx };
    });

    return grouped;
  }, [rows]);

  const updateCell = (rowIdx: number, field: string, value: any) => {
    setRows(prev => {
      const copy = [...prev];
      copy[rowIdx] = { ...copy[rowIdx], [field]: value };
      return copy;
    });
  };

  const turnarounds = ['12h', '24h', '48h', '72h', '7d'];

  return (
    <div>
      <SectionHeader
        title="Price Table"
        description="Edit individual prices for every service, difficulty level, and turnaround time."
      />
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        {Object.keys(services).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-gray-500">No pricing data loaded.</p>
            <p className="text-[14px] text-gray-400 mt-1">Use the Pricing Table editor to add pricing data.</p>
          </div>
        ) : (
          Object.entries(services).map(([name, service]) => (
            <div key={name} className="border border-gray-200/80 rounded-xl mb-3">
              <button
                onClick={() => setExpandedService(expandedService === name ? null : name)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-medium text-gray-900">{name}</span>
                  <span className="text-[14px] text-gray-400">
                    {Object.keys(service.tiers).length} levels, {turnarounds.length} speeds
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expandedService === name ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedService === name && (
                <div className="px-4 pb-4 border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-[14px] mt-3">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium text-gray-400 uppercase tracking-wider text-[14px]">Level</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-400 uppercase tracking-wider text-[14px]">Proc</th>
                        {turnarounds.map(t => (
                          <th key={t} className="text-center py-2 px-2 font-medium text-gray-400 uppercase tracking-wider text-[14px]">{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(service.tiers).map(([tierKey, tierInfo]) => (
                        <tr key={tierKey} className="border-b border-gray-50">
                          <td className="py-2 pr-4">
                            <div className="text-[14px] text-gray-400 uppercase">{tierKey}</div>
                            <div className="text-[14px] font-medium text-gray-900">{tierInfo.label}</div>
                          </td>
                          <td className="py-2 px-2 text-[14px] text-gray-400 text-center">
                            {rows[tierInfo.rowIdx]?.procMin}-{rows[tierInfo.rowIdx]?.procMax}
                          </td>
                          {turnarounds.map(turnaround => (
                            <td key={turnaround} className="py-2 px-2">
                              <input
                                type="number"
                                step="0.01"
                                value={rows[tierInfo.rowIdx]?.[turnaround] ?? 0}
                                onChange={e => updateCell(tierInfo.rowIdx, turnaround, parseFloat(e.target.value) || 0)}
                                className="w-[72px] h-8 border border-gray-200 rounded-md px-2 text-[14px] text-center text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
        <SaveBar onSave={handleSave} onReset={handleReset} saved={saved} />
      </div>
    </div>
  );
};
