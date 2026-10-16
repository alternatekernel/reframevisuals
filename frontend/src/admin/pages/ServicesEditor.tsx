import React, { useState } from 'react';
import { useContent } from '../../context/ContentBase';
import { SectionHeader } from '../components/SectionHeader';
import { FormInput } from '../components/FormInput';
import { FormTextarea } from '../components/FormTextarea';
import { FormNumber } from '../components/FormNumber';
import { ListEditor } from '../components/ListEditor';
import { SaveBar } from '../components/SaveBar';
import { sortServicesByDisplayOrder } from '../../data/services';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description: string;
  detail: string;
  includes: string[];
  bestFor: string;
  keywords: string[];
}

export const ServicesEditor: React.FC = () => {
  const { getSectionContent, setSectionContent, resetSection } = useContent();
  const [services, setServices] = useState<ServiceItem[]>(() => {
    const content = getSectionContent('services');
    return (content.services && Array.isArray(content.services)) ? content.services : [];
  });
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const orderedServices = sortServicesByDisplayOrder(services as any[]);

  const handleSave = () => {
    setSectionContent('services', { services });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetSection('services');
    const content = getSectionContent('services');
    setServices(content.services || []);
  };

  const updateService = (index: number, field: string, value: any) => {
    const copy = [...services];
    (copy[index] as any)[field] = value;
    setServices(copy);
  };

  return (
    <div>
      <SectionHeader
        title="All Services"
        description="Edit service names, prices, descriptions, and details."
      />
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-gray-500">Service data loads from the source file.</p>
            <p className="text-[14px] text-gray-400 mt-1">Edit <code className="bg-gray-100 px-1.5 py-0.5 rounded">src/data/services.ts</code> to add services, then use this editor to modify them.</p>
          </div>
        ) : (
          orderedServices.map((service) => (
            <div key={service.id} className="border border-gray-200/80 rounded-xl mb-3">
              <button
                onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-medium text-gray-900">{service.name}</span>
                  <span className="text-[14px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">${service.price}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expandedId === service.id ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expandedId === service.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <FormInput label="Name" value={service.name} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'name', v)} />
                  <FormNumber label="Price" value={service.price} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'price', v)} step={0.01} suffix="$" />
                  <FormInput label="Category" value={service.categoryId} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'categoryId', v)} />
                  <FormInput label="Description" value={service.description} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'description', v)} />
                  <FormTextarea label="Full Detail" value={service.detail} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'detail', v)} />
                  <ListEditor label="What's Included" items={service.includes} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'includes', v)} />
                  <FormInput label="Best For" value={service.bestFor} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'bestFor', v)} />
                  <ListEditor label="Keywords" items={service.keywords} onChange={v => updateService(services.findIndex(s => s.id === service.id), 'keywords', v)} placeholder="Add keyword..." />
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
