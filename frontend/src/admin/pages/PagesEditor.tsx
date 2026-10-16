import React, { useState } from 'react';
import { GenericEditor } from '../components/GenericEditor';
import { AdminSectionMeta } from '../types';

const PAGE_SECTIONS: { id: string; label: string; meta: AdminSectionMeta }[] = [
  {
    id: 'servicesPage', label: 'Services',
    meta: { id: 'servicesPage', label: 'Services Page', description: 'Text on the services listing page', parentPage: '/services',
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' }, { key: 'heading', label: 'Heading', type: 'text' },
        { key: 'subheading', label: 'Subheading', type: 'text' }, { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'ctaLabel', label: 'Button', type: 'text' }, { key: 'footerText', label: 'Footer', type: 'text' },
      ], defaultContent: {} },
  },
  {
    id: 'pricingPage', label: 'Pricing',
    meta: { id: 'pricingPage', label: 'Pricing Page', description: 'Text on the pricing page', parentPage: '/pricing',
      fields: [
        { key: 'heading', label: 'Heading', type: 'text' }, { key: 'subheading', label: 'Subheading', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' }, { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'footerText', label: 'Footer', type: 'text' },
      ], defaultContent: {} },
  },
  {
    id: 'aboutPage', label: 'About',
    meta: { id: 'aboutPage', label: 'About Page', description: 'Text on the about page', parentPage: '/about',
      fields: [
        { key: 'heading', label: 'Heading', type: 'text' }, { key: 'subheading', label: 'Subheading', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ], defaultContent: {} },
  },
  {
    id: 'freeTrial', label: 'Free Trial',
    meta: { id: 'freeTrial', label: 'Free Trial Page', description: 'Headings and success messages', parentPage: '/free-trial',
      fields: [
        { key: 'heading', label: 'Heading', type: 'text' }, { key: 'subheading', label: 'Subheading', type: 'text' },
        { key: 'ctaLabel', label: 'Button', type: 'text' }, { key: 'successHeading', label: 'Success Heading', type: 'text' },
        { key: 'successText', label: 'Success Message', type: 'text' },
      ], defaultContent: {} },
  },
  {
    id: 'bookMeeting', label: 'Book Meeting',
    meta: { id: 'bookMeeting', label: 'Book Meeting Page', description: 'Headings and success messages', parentPage: '/book-meeting',
      fields: [
        { key: 'heading', label: 'Heading', type: 'text' }, { key: 'subheading', label: 'Subheading', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' }, { key: 'ctaLabel', label: 'Button', type: 'text' },
        { key: 'successHeading', label: 'Success Heading', type: 'text' }, { key: 'successText', label: 'Success Message', type: 'text' },
      ], defaultContent: {} },
  },
  {
    id: 'serviceDetail', label: 'Service Detail',
    meta: { id: 'serviceDetail', label: 'Service Detail Page', description: 'Text on individual service pages', parentPage: '/services/:id',
      fields: [
        { key: 'ctaLabel', label: 'Button', type: 'text' }, { key: 'relatedHeading', label: 'Related Heading', type: 'text' },
        { key: 'bottomHeading', label: 'Bottom Heading', type: 'text' }, { key: 'bottomDescription', label: 'Bottom Text', type: 'text' },
      ], defaultContent: {} },
  },
];

export const PagesEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState(PAGE_SECTIONS[0].id);

  const active = PAGE_SECTIONS.find(p => p.id === activeTab);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">Page Headings</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">Edit the text shown at the top of each page.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {PAGE_SECTIONS.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-3 py-1.5 rounded-md text-[14px] font-medium transition-all whitespace-nowrap ${
              activeTab === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {active && <GenericEditor meta={active.meta} />}
    </div>
  );
};
