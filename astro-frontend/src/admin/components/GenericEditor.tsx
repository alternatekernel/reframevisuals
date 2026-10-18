import React, { useState } from 'react';
import { AdminSectionMeta } from '../types';
import { useContent } from '../../context/ContentBase';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormNumber } from './FormNumber';
import { FormColor } from './FormColor';
import { FormToggle } from './FormToggle';
import { ListEditor } from './ListEditor';

interface GenericEditorProps {
  meta: AdminSectionMeta;
}

export const GenericEditor: React.FC<GenericEditorProps> = ({ meta }) => {
  const { getSectionContent, setSectionContent } = useContent();
  const [content, setContent] = useState<Record<string, any>>(() => getSectionContent(meta.id));

  const updateField = (key: string, value: any) => {
    const next = { ...content, [key]: value };
    setContent(next);
    setSectionContent(meta.id, next);
  };

  const renderField = (field: any) => {
    const value = content[field.key];
    switch (field.type) {
      case 'text': return <FormInput key={field.key} label={field.label} value={value || ''} onChange={v => updateField(field.key, v)} />;
      case 'url': return <FormInput key={field.key} label={field.label} value={value || ''} onChange={v => updateField(field.key, v)} type="url" />;
      case 'textarea': return <FormTextarea key={field.key} label={field.label} value={value || ''} onChange={v => updateField(field.key, v)} />;
      case 'number': return <FormNumber key={field.key} label={field.label} value={value || 0} onChange={v => updateField(field.key, v)} step={0.01} />;
      case 'color': return <FormColor key={field.key} label={field.label} value={value || '#000000'} onChange={v => updateField(field.key, v)} />;
      case 'toggle': return <FormToggle key={field.key} label={field.label} value={!!value} onChange={v => updateField(field.key, v)} />;
      case 'list': return <ListEditor key={field.key} label={field.label} items={Array.isArray(value) ? value : []} onChange={v => updateField(field.key, v)} />;
      default: return <FormInput key={field.key} label={field.label} value={value || ''} onChange={v => updateField(field.key, v)} />;
    }
  };

  // Split fields into 2 columns
  const singleColFields = meta.fields.filter(f => f.type === 'list' || f.type === 'textarea');
  const twoColFields = meta.fields.filter(f => f.type !== 'list' && f.type !== 'textarea');

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">{meta.label}</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">{meta.description}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200/80 p-5">
        {/* Two-column for short fields */}
        {twoColFields.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4">
            {twoColFields.map(field => renderField(field))}
          </div>
        )}
        {/* Single column for long fields */}
        {singleColFields.length > 0 && (
          <div className={twoColFields.length > 0 ? 'mt-2' : ''}>
            {singleColFields.map(field => renderField(field))}
          </div>
        )}
      </div>
    </div>
  );
};
