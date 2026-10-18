import React from 'react';
import { useContent } from '../../context/ContentBase';
import { FormInput } from '../components/FormInput';

export const ImagesLinksEditor: React.FC = () => {
  const { getSectionContent, setSectionContent } = useContent();
  const images = getSectionContent('images');
  const navigation = getSectionContent('navigation');
  const footer = getSectionContent('footer');

  const updateImage = (key: string, value: string) => {
    setSectionContent('images', { ...images, [key]: value });
  };
  const updateNav = (key: string, value: string) => {
    setSectionContent('navigation', { ...navigation, [key]: value });
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-[18px] font-bold text-gray-900 tracking-tight">Images & Links</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">Manage image URLs, contact links, and social media.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200/80 p-5">
        <div className="grid grid-cols-2 gap-x-4">
          <h3 className="col-span-2 text-[14px] font-semibold text-gray-900 mb-2">Image URLs</h3>
          <FormInput label="Hero Image" value={images.heroImage || ''} onChange={v => updateImage('heroImage', v)} type="url" />
          <FormInput label="CTA Background" value={images.ctaBackground || ''} onChange={v => updateImage('ctaBackground', v)} type="url" />
          <FormInput label="Footer Background" value={images.footerBackground || ''} onChange={v => updateImage('footerBackground', v)} type="url" />
          <FormInput label="About Image" value={images.aboutImage || ''} onChange={v => updateImage('aboutImage', v)} type="url" />
          <div className="col-span-2 border-t border-gray-100 my-3" />
          <h3 className="col-span-2 text-[14px] font-semibold text-gray-900 mb-2">Contact Links</h3>
          <FormInput label="WhatsApp" value={navigation.whatsappLink || ''} onChange={v => updateNav('whatsappLink', v)} type="url" />
          <FormInput label="Telegram" value={navigation.telegramLink || ''} onChange={v => updateNav('telegramLink', v)} type="url" />
          <FormInput label="Email" value={navigation.emailLink || ''} onChange={v => updateNav('emailLink', v)} type="url" />
          <div className="col-span-2 border-t border-gray-100 my-3" />
          <h3 className="col-span-2 text-[14px] font-semibold text-gray-900 mb-2">Social Media</h3>
          {(footer.socialLinks || []).map((link: any, i: number) => (
            <FormInput key={i} label={link.platform} value={link.url} onChange={v => {
              const copy = [...(footer.socialLinks || [])];
              copy[i] = { ...copy[i], url: v };
              setSectionContent('footer', { ...footer, socialLinks: copy });
            }} type="url" />
          ))}
        </div>
      </div>
    </div>
  );
};
