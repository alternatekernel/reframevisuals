import React, { useMemo } from 'react';
import { useContent } from '../../context/ContentBase';
import { GenericEditor } from '../components/GenericEditor';
import { AdminSectionMeta } from '../types';

interface SectionEditorProps {
  sectionId: string;
}

const BUILTIN_META: Record<string, AdminSectionMeta> = {
  hero: {
    id: 'hero', label: 'Hero Banner', description: 'Main homepage headline, subtitle, and buttons', parentPage: '/',
    fields: [
      { key: 'headline', label: 'Main Headline', type: 'text' },
      { key: 'eyebrow', label: 'Small Label Above', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { key: 'cta1Label', label: 'Primary Button', type: 'text' },
      { key: 'cta1Link', label: 'Primary Link', type: 'url' },
      { key: 'cta2Label', label: 'Secondary Button', type: 'text' },
      { key: 'cta2Link', label: 'Secondary Link', type: 'url' },
      { key: 'caption', label: 'Image Caption', type: 'text' },
    ], defaultContent: {},
  },
  ticker: {
    id: 'ticker', label: 'Scrolling Bar', description: 'Scrolling text bar at top of homepage', parentPage: '/',
    fields: [{ key: 'items', label: 'Scrolling Messages', type: 'list' }], defaultContent: {},
  },
  stats: {
    id: 'stats', label: 'Statistics', description: 'Research data and statistics section', parentPage: '/',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'footer', label: 'Bottom Text', type: 'text' },
    ], defaultContent: {},
  },
  faq: {
    id: 'faq', label: 'Questions & Answers', description: 'FAQ section on homepage and blog page', parentPage: '/',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ], defaultContent: {},
  },
  differentiators: {
    id: 'differentiators', label: 'Why Us', description: 'Old way vs new way comparison', parentPage: '/',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'oldLabel', label: 'Old Way Title', type: 'text' },
      { key: 'newLabel', label: 'New Way Title', type: 'text' },
    ], defaultContent: {},
  },
  workflow: {
    id: 'workflow', label: 'How It Works', description: 'Three-step process on homepage', parentPage: '/',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ], defaultContent: {},
  },
  integrations: {
    id: 'integrations', label: 'Integrations', description: 'Storage connection providers', parentPage: '/',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'ctaLabel', label: 'Button Text', type: 'text' },
      { key: 'comingSoon', label: 'Coming Soon Text', type: 'text' },
    ], defaultContent: {},
  },
  navigation: {
    id: 'navigation', label: 'Top Menu', description: 'Navigation bar brand, links, buttons', parentPage: 'site-wide',
    fields: [
      { key: 'brandName', label: 'Brand Name', type: 'text' },
      { key: 'brandNameSub', label: 'Brand Sub', type: 'text' },
      { key: 'ctaLabel', label: 'Main Button', type: 'text' },
      { key: 'dropdownFooter', label: 'Menu Footer', type: 'text' },
      { key: 'dropdownCta', label: 'Menu Button', type: 'text' },
      { key: 'whatsappLink', label: 'WhatsApp', type: 'url' },
      { key: 'telegramLink', label: 'Telegram', type: 'url' },
      { key: 'emailLink', label: 'Email', type: 'url' },
    ], defaultContent: {},
  },
  footer: {
    id: 'footer', label: 'Footer', description: 'Site footer with links and social media', parentPage: 'site-wide',
    fields: [
      { key: 'brandName', label: 'Brand Name', type: 'text' },
      { key: 'brandDescription', label: 'Description', type: 'text' },
      { key: 'trustNumber', label: 'Trust Number', type: 'text' },
      { key: 'trustLabel', label: 'Trust Label', type: 'text' },
      { key: 'ctaLabel', label: 'CTA Label', type: 'text' },
      { key: 'ctaTitle', label: 'CTA Title', type: 'text' },
      { key: 'copyright', label: 'Copyright', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'version', label: 'Version', type: 'text' },
    ], defaultContent: {},
  },
  chatWidget: {
    id: 'chatWidget', label: 'Chat Assistant', description: 'AI chat assistant settings', parentPage: 'site-wide',
    fields: [
      { key: 'title', label: 'Chat Title', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'welcomeMessage', label: 'First Message', type: 'textarea' },
      { key: 'systemPrompt', label: 'AI Instructions', type: 'textarea' },
      { key: 'inputPlaceholder', label: 'Input Placeholder', type: 'text' },
      { key: 'errorMessage', label: 'Error Message', type: 'text' },
      { key: 'typingLabel', label: 'Typing Text', type: 'text' },
    ], defaultContent: {},
  },
  cta: {
    id: 'cta', label: 'Call to Action', description: 'CTA banner section', parentPage: '/',
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Subheading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'buttonLabel', label: 'Button', type: 'text' },
      { key: 'discount', label: 'Discount Text', type: 'text' },
    ], defaultContent: {},
  },
};

export const SectionEditor: React.FC<SectionEditorProps> = ({ sectionId }) => {
  const { registeredSections } = useContent();

  const meta = useMemo(() => {
    const auto = registeredSections.find(s => s.id === sectionId);
    if (auto) return auto;
    return BUILTIN_META[sectionId];
  }, [sectionId, registeredSections]);

  if (!meta) {
    return <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[15px] text-amber-700">Section not found: {sectionId}</div>;
  }

  return <GenericEditor meta={meta} />;
};
