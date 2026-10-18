import React, { useState } from 'react';
import { useContent } from '../../context/ContentBase';
import { SectionHeader } from '../components/SectionHeader';
import { FormInput } from '../components/FormInput';
import { FormNumber } from '../components/FormNumber';
import { FormToggle } from '../components/FormToggle';
import { ListEditor } from '../components/ListEditor';
import { SaveBar } from '../components/SaveBar';

interface PricingPlan {
  name: string;
  price: number | null;
  perUnit: string;
  services: string[];
  savings: string;
  popular?: boolean;
}

export const PricingPlansEditor: React.FC = () => {
  const { getSectionContent, setSectionContent, resetSection } = useContent();
  const [plans, setPlans] = useState<PricingPlan[]>(() => {
    const content = getSectionContent('pricingPlans');
    return (content.plans && Array.isArray(content.plans)) ? content.plans : [];
  });
  const [saved, setSaved] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleSave = () => {
    setSectionContent('pricingPlans', { plans });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSection('pricingPlans');
    const content = getSectionContent('pricingPlans');
    setPlans(content.plans || []);
  };

  const updatePlan = (index: number, field: string, value: any) => {
    const copy = [...plans];
    (copy[index] as any)[field] = value;
    setPlans(copy);
  };

  return (
    <div>
      <SectionHeader
        title="Pricing Cards"
        description="Edit the pricing plan cards shown on your pricing page."
      />
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-gray-500">Pricing plans load from the source file.</p>
            <p className="text-[14px] text-gray-400 mt-1">Edit <code className="bg-gray-100 px-1.5 py-0.5 rounded">src/pages/PricingPage.tsx</code> to add plans.</p>
          </div>
        ) : (
          plans.map((plan, i) => (
            <div key={i} className="border border-gray-200/80 rounded-xl mb-3">
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-medium text-gray-900">{plan.name}</span>
                  <span className="text-[14px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                    {plan.price !== null ? `$${plan.price}` : "Custom"}
                  </span>
                  {plan.popular && <span className="text-[14px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md font-medium">Popular</span>}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedIdx === i && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <FormInput label="Plan Name" value={plan.name} onChange={v => updatePlan(i, 'name', v)} />
                  <FormNumber label="Price (set to 0 for custom pricing)" value={plan.price ?? 0} onChange={v => updatePlan(i, 'price', v === 0 ? null : v)} step={0.01} suffix="$" />
                  <FormInput label="Per Unit Label" value={plan.perUnit} onChange={v => updatePlan(i, 'perUnit', v)} />
                  <ListEditor label="Included Services" items={plan.services} onChange={v => updatePlan(i, 'services', v)} />
                  <FormInput label="Savings Label" value={plan.savings} onChange={v => updatePlan(i, 'savings', v)} />
                  <FormToggle label="Show as Most Popular" value={!!plan.popular} onChange={v => updatePlan(i, 'popular', v)} />
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
