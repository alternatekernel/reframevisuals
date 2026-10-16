import React from 'react';
import { useContent } from '../../context/ContentBase';
import { SectionHeader } from '../components/SectionHeader';
import { FormInput } from '../components/FormInput';
import { FormTextarea } from '../components/FormTextarea';
import { ListEditor } from '../components/ListEditor';
import { SaveBar } from '../components/SaveBar';

export const UsecasesEditor: React.FC = () => {
  const { getSectionContent, setSectionContent, resetSection } = useContent();
  const content = getSectionContent('usecases');
  const [usecases, setUsecases] = React.useState<any[]>(content.usecases || []);
  const [saved, setSaved] = React.useState(false);
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    const c = getSectionContent('usecases');
    setUsecases(c.usecases || []);
  }, [getSectionContent]);

  const handleSave = () => {
    setSectionContent('usecases', { usecases });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSection('usecases');
    const c = getSectionContent('usecases');
    setUsecases(c.usecases || []);
  };

  const updateUsecase = (index: number, field: string, value: any) => {
    const copy = [...usecases];
    copy[index] = { ...copy[index], [field]: value };
    setUsecases(copy);
  };

  return (
    <div>
      <SectionHeader
        title="Customer Scenarios"
        description="Edit the use case scenarios that help customers find the right services."
      />
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        {usecases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-gray-500">Use case data loads from the source file.</p>
            <p className="text-[14px] text-gray-400 mt-1">Edit <code className="bg-gray-100 px-1.5 py-0.5 rounded">src/data/usecases.ts</code> to add use cases.</p>
          </div>
        ) : (
          usecases.map((uc, i) => (
            <div key={uc.id} className="border border-gray-200/80 rounded-xl mb-3">
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-medium text-gray-900">{uc.label}</span>
                  <span className="text-[14px] text-gray-400">{uc.tagline}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedIdx === i && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <FormInput label="Label" value={uc.label} onChange={v => updateUsecase(i, 'label', v)} />
                  <FormInput label="Tagline" value={uc.tagline} onChange={v => updateUsecase(i, 'tagline', v)} />
                  <FormTextarea label="Description" value={uc.description} onChange={v => updateUsecase(i, 'description', v)} />
                  <ListEditor label="Recommended Services" items={uc.recommended || []} onChange={v => updateUsecase(i, 'recommended', v)} />
                  <ListEditor label="Optional Services" items={uc.optional || []} onChange={v => updateUsecase(i, 'optional', v)} />
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
