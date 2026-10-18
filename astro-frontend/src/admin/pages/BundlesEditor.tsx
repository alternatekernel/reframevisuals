import React, { useState } from 'react';
import { useContent } from '../../context/ContentBase';
import { SectionHeader } from '../components/SectionHeader';
import { FormInput } from '../components/FormInput';
import { FormTextarea } from '../components/FormTextarea';
import { FormNumber } from '../components/FormNumber';
import { FormToggle } from '../components/FormToggle';
import { ListEditor } from '../components/ListEditor';
import { SaveBar } from '../components/SaveBar';

interface BundleItem {
  id: string;
  name: string;
  price: number;
  serviceIds: string[];
  description: string;
  savings: string;
  highlight?: boolean;
  keywords: string[];
}

export const BundlesEditor: React.FC = () => {
  const { getSectionContent, setSectionContent, resetSection } = useContent();
  const [bundles, setBundles] = useState<BundleItem[]>(() => {
    const content = getSectionContent('bundles');
    return (content.bundles && Array.isArray(content.bundles)) ? content.bundles : [];
  });
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSave = () => {
    setSectionContent('bundles', { bundles });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSection('bundles');
    const content = getSectionContent('bundles');
    setBundles(content.bundles || []);
  };

  const updateBundle = (index: number, field: string, value: any) => {
    const copy = [...bundles];
    (copy[index] as any)[field] = value;
    setBundles(copy);
  };

  return (
    <div>
      <SectionHeader
        title="Service Bundles"
        description="Edit bundle packages - names, prices, included services, and savings."
      />
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        {bundles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-gray-500">Bundle data loads from the source file.</p>
            <p className="text-[14px] text-gray-400 mt-1">Edit <code className="bg-gray-100 px-1.5 py-0.5 rounded">src/data/services.ts</code> to add bundles.</p>
          </div>
        ) : (
          bundles.map((bundle, i) => (
            <div key={bundle.id} className="border border-gray-200/80 rounded-xl mb-3">
              <button
                onClick={() => setExpandedId(expandedId === bundle.id ? null : bundle.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-medium text-gray-900">{bundle.name}</span>
                  <span className="text-[14px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">${bundle.price}</span>
                  {bundle.highlight && <span className="text-[14px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md font-medium">Popular</span>}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expandedId === bundle.id ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedId === bundle.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <FormInput label="Name" value={bundle.name} onChange={v => updateBundle(i, 'name', v)} />
                  <FormNumber label="Price" value={bundle.price} onChange={v => updateBundle(i, 'price', v)} step={0.01} suffix="$" />
                  <FormTextarea label="Description" value={bundle.description} onChange={v => updateBundle(i, 'description', v)} />
                  <FormInput label="Savings Label" value={bundle.savings} onChange={v => updateBundle(i, 'savings', v)} />
                  <FormToggle label="Mark as Most Popular" value={!!bundle.highlight} onChange={v => updateBundle(i, 'highlight', v)} />
                  <ListEditor label="Included Services" items={bundle.serviceIds} onChange={v => updateBundle(i, 'serviceIds', v)} placeholder="service-id" />
                  <ListEditor label="Keywords" items={bundle.keywords} onChange={v => updateBundle(i, 'keywords', v)} placeholder="Add keyword..." />
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
