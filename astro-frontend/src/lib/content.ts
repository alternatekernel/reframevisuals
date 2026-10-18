// Server-side CMS sections: GET /sections merged over ALL_SECTION_DEFAULTS, like ContentProvider.syncWithBackend.
import { ALL_SECTION_DEFAULTS } from '../data/siteDefaults';
import { apiGet } from './serverApi';
import { isExcludedService } from './serviceData';

export type Sections = Record<string, Record<string, any>>;

let cache: { at: number; value: Sections } | null = null;

export async function loadSections(): Promise<Sections> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const res = await apiGet<{ success?: boolean; data?: Array<{ sectionId: string; content: any }> }>('/sections');
  const backend: Sections = {};
  if (res?.success && Array.isArray(res.data)) for (const s of res.data) backend[s.sectionId] = s.content;
  const merged: Sections = {};
  for (const [key, defaults] of Object.entries(ALL_SECTION_DEFAULTS)) merged[key] = { ...defaults, ...(backend[key] || {}) };
  if (Array.isArray(merged.services?.services)) merged.services.services = merged.services.services.filter((s: any) => !isExcludedService(s));
  if (Array.isArray(merged.pricingMatrix?.rows)) {
    let current = '';
    merged.pricingMatrix.rows = merged.pricingMatrix.rows.filter((row: any) => {
      if (row.service) current = row.service;
      return !isExcludedService({ name: current });
    });
  }
  cache = { at: Date.now(), value: merged };
  return merged;
}

export const getSection = (sections: Sections, id: string): Record<string, any> => sections[id] || ALL_SECTION_DEFAULTS[id] || {};
