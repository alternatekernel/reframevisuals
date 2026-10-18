/**
 * GEO / AEO / AIO Scorer
 * Based on GetCito open-source methodology (ai-search-guru/getcito-worlds-first-open-source-aio-aeo-or-geo-tool)
 *
 * Six weighted categories (0-100 each):
 *   AI Citability        25%
 *   Brand Authority      20%
 *   Content E-E-A-T      20%
 *   Technical GEO        15%
 *   Schema & Struct.     10%
 *   Platform Optim.      10%
 *
 * Grades: 0-39 Weak | 40-69 Fair | 70-84 Good | 85-100 Strong
 */

export type GeoGrade = 'Weak' | 'Fair' | 'Good' | 'Strong';

export interface GeoSignals {
  content?: string;
  schemaType?: string | null;
  focusKeywords?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  hreflang?: string | null;
  hasAuthor?: boolean;
  hasPublishDate?: boolean;
  hasFaqSection?: boolean;
  hasTables?: boolean;
  hasLists?: boolean;
  hasImage?: boolean;
  hasStatisticsWithCitations?: boolean;
  wordCount?: number;
  // Brand authority
  hasYouTube?: boolean;
  hasRedditPresence?: boolean;
  hasLinkedIn?: boolean;
  hasWikipedia?: boolean;
  hasWikidata?: boolean;
  hasTrustpilot?: boolean;
  hasCrunchbase?: boolean;
  hasGoogleBusinessProfile?: boolean;
  hasPressmentions?: boolean;
  sameAsCount?: number;
  // Technical (from live audit)
  allowsGPTBot?: boolean;
  allowsClaudeBot?: boolean;
  allowsPerplexityBot?: boolean;
  allowsGoogleExtended?: boolean;
  allowsOAISearchBot?: boolean;
  allowsBingbot?: boolean;
  allowsApplebot?: boolean;
  hasLlmsTxt?: boolean;
  hasSitemap?: boolean;
  hasCanonical?: boolean;
  hasOpenGraph?: boolean;
  hasIndexNow?: boolean;
  isHttps?: boolean;
  hasSSRContent?: boolean;
}

export interface GeoBreakdown {
  aiCitability: number;
  brandAuthority: number;
  contentEEAT: number;
  technicalGEO: number;
  schemaStructuredData: number;
  platformOptimization: number;
}

export interface GeoPlatformScores {
  googleAIOverviews: number;
  chatGPT: number;
  perplexity: number;
  gemini: number;
  bingCopilot: number;
}

export interface GeoScoreResult {
  overall: number;
  grade: GeoGrade;
  gradeColor: string;
  breakdown: GeoBreakdown;
  platformScores: GeoPlatformScores;
  recommendations: string[];
  wordCount: number;
  questionHeadingCount: number;
  hasQuestionHeadings: boolean;
  faqCount: number;
  tableCount: number;
  listCount: number;
}

// Helpers
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 1).length;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[.*?\]\(.*?\)/g, ' ')
    .replace(/#{1,6}\s*/g, ' ')
    .replace(/[*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(content: string): string[] {
  const mdH = Array.from(content.matchAll(/^#{2,3}\s+(.+)$/gm)).map((m) => m[1].trim());
  const htmlH = Array.from(content.matchAll(/<h[2-3][^>]*>(.*?)<\/h[2-3]>/gi)).map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
  return [...mdH, ...htmlH];
}

function countTables(content: string): number {
  const md = (content.match(/^\|.+\|$/gm) || []).length;
  const html = (content.match(/<table[\s\S]*?<\/table>/gi) || []).length;
  return html + (md > 0 ? 1 : 0);
}

function countLists(content: string): number {
  const ul = (content.match(/^[-*+]\s+\S/gm) || []).length;
  const ol = (content.match(/^\d+\.\s+\S/gm) || []).length;
  const html = (content.match(/<[ou]l[\s\S]*?<\/[ou]l>/gi) || []).length;
  return html + (ul > 0 ? 1 : 0) + (ol > 0 ? 1 : 0);
}

function countFaqItems(content: string): number {
  return extractHeadings(content).filter(
    (h) => h.endsWith('?') || /^(what|how|why|when|where|which|who|can|is|are|does|do)\b/i.test(h)
  ).length;
}

// Category scorers
function scoreAICitability(sig: GeoSignals, d: { wordCount: number; questionHeadingCount: number; tableCount: number; listCount: number; faqCount: number }): number {
  let s = 0;
  if (d.questionHeadingCount > 0) s += 10;
  if (d.questionHeadingCount >= 3) s += 5;
  if (d.questionHeadingCount > 0 && d.wordCount > 200) s += 15;
  if (d.tableCount > 0) s += 10;
  if (d.tableCount >= 2) s += 5;
  if (d.listCount > 0) s += 10;
  if (d.faqCount >= 3) s += 10;
  if (d.faqCount >= 5) s += 5;
  if (sig.hasStatisticsWithCitations) s += 10;
  if (sig.hasPublishDate) s += 5;
  if (sig.hasAuthor) s += 5;
  if (d.wordCount >= 1500) s += 5;
  if (d.wordCount >= 3000) s += 5;
  return Math.min(100, s);
}

function scoreBrandAuthority(sig: GeoSignals): number {
  let s = 0;
  if (sig.hasWikipedia) s += 20;
  if (sig.hasWikidata) s += 10;
  if (sig.hasRedditPresence) s += 10;
  if (sig.hasYouTube) s += 10;
  if (sig.hasLinkedIn) s += 10;
  if (sig.hasTrustpilot) s += 8;
  if (sig.hasCrunchbase) s += 5;
  if (sig.hasGoogleBusinessProfile) s += 10;
  if (sig.hasPressmentions) s += 12;
  const sa = sig.sameAsCount ?? 0;
  if (sa >= 3) s += 3;
  if (sa >= 6) s += 2;
  return Math.min(100, s);
}

function scoreContentEEAT(sig: GeoSignals, d: { wordCount: number }): number {
  let s = 0;
  if (sig.hasAuthor) s += 20;
  if (sig.hasPublishDate) s += 20;
  if (sig.hasStatisticsWithCitations) s += 25;
  if (sig.hasFaqSection) s += 10;
  if (sig.hasImage) s += 5;
  if (sig.hasPressmentions) s += 10;
  if (sig.hasLinkedIn || sig.hasYouTube) s += 5;
  if (d.wordCount >= 1000) s += 5;
  return Math.min(100, s);
}

function scoreTechnicalGEO(sig: GeoSignals): number {
  let s = 0;
  const bots = [
    sig.allowsGPTBot ?? true, sig.allowsClaudeBot ?? true, sig.allowsPerplexityBot ?? true,
    sig.allowsGoogleExtended ?? true, sig.allowsOAISearchBot ?? true, sig.allowsBingbot ?? true, sig.allowsApplebot ?? true,
  ];
  s += Math.round((bots.filter(Boolean).length / 7) * 25);
  if (sig.isHttps ?? true) s += 10;
  if (sig.hasSSRContent ?? true) s += 15;
  if (sig.hasLlmsTxt) s += 10;
  if (sig.hasSitemap ?? false) s += 10;
  if (sig.hasCanonical ?? false) s += 10;
  if (sig.hasOpenGraph ?? false) s += 5;
  if (sig.hasIndexNow) s += 5;
  return Math.min(100, s);
}

function scoreSchema(sig: GeoSignals, d: { faqCount: number }): number {
  let s = 0;
  const type = (sig.schemaType || '').toLowerCase();
  if (type) s += 20;
  if (['organization', 'localbusiness'].includes(type)) s += 10;
  if (type === 'faqpage' || d.faqCount >= 3) s += 15;
  if (['article', 'blogposting', 'newsarticle', 'techarticle'].includes(type)) s += 10;
  if (type === 'howto') s += 10;
  if (type === 'service' || type === 'product') s += 10;
  if (sig.hreflang) s += 10;
  const sa = sig.sameAsCount ?? 0;
  if (sa >= 3) s += 10;
  if (sig.hasAuthor) s += 5;
  return Math.min(100, s);
}

function scorePlatformGoogle(sig: GeoSignals, d: { questionHeadingCount: number; tableCount: number; listCount: number; faqCount: number; wordCount: number }): number {
  let s = 0;
  if (d.questionHeadingCount > 0) s += 10;
  if (d.questionHeadingCount > 0 && d.wordCount > 200) s += 15;
  if (d.tableCount > 0) s += 10;
  if (d.listCount > 0) s += 10;
  if (d.faqCount >= 5) s += 10;
  if (sig.hasStatisticsWithCitations) s += 10;
  if (sig.hasPublishDate) s += 5;
  if (sig.hasAuthor) s += 5;
  if (sig.hasWikipedia || sig.hasPressmentions) s += 20;
  else if (sig.hasLinkedIn && sig.hasTrustpilot) s += 5;
  return Math.min(100, s);
}

function scorePlatformChatGPT(sig: GeoSignals, d: { wordCount: number }): number {
  let s = 0;
  if (sig.hasWikipedia) s += 20;
  if (sig.hasWikidata) s += 10;
  if (sig.hasRedditPresence) s += 10;
  if (sig.hasYouTube) s += 10;
  if (sig.hasPressmentions) s += 15;
  const sa = sig.sameAsCount ?? 0;
  if (sa >= 5) s += 10;
  if (d.wordCount >= 2000) s += 10;
  if (sig.hasLinkedIn) s += 5;
  return Math.min(100, s);
}

function scorePlatformPerplexity(sig: GeoSignals, d: { wordCount: number; faqCount: number }): number {
  let s = 0;
  if (sig.hasRedditPresence) s += 20;
  if (sig.hasStatisticsWithCitations) s += 15;
  if (sig.hasPublishDate) s += 10;
  if (sig.hasFaqSection || d.faqCount >= 3) s += 10;
  if (sig.hasYouTube) s += 10;
  if (sig.hasWikipedia || sig.hasWikidata) s += 5;
  const sa = sig.sameAsCount ?? 0;
  if (sa >= 7) s += 10;
  if (d.wordCount >= 1500) s += 10;
  if (sig.hasStatisticsWithCitations) s += 10;
  return Math.min(100, s);
}

function scorePlatformGemini(sig: GeoSignals, d: { faqCount: number }): number {
  let s = 0;
  if (sig.hasGoogleBusinessProfile) s += 10;
  if (sig.hasYouTube) s += 20;
  const type = (sig.schemaType || '').toLowerCase();
  if (type && (d.faqCount >= 3 || type === 'service')) s += 15;
  if (sig.hasWikipedia || sig.hasWikidata) s += 10;
  const sa = sig.sameAsCount ?? 0;
  if (sa >= 5) s += 10;
  if (sig.hasPressmentions) s += 10;
  if (sig.hasLinkedIn) s += 5;
  if (sig.hasImage) s += 5;
  if (sig.hasAuthor) s += 5;
  return Math.min(100, s);
}

function scorePlatformBing(sig: GeoSignals): number {
  let s = 0;
  if (sig.hasIndexNow) s += 15;
  if (sig.hasSitemap ?? false) s += 15;
  if (sig.hasLinkedIn) s += 10;
  if (sig.hasOpenGraph ?? false) s += 10;
  const sa = sig.sameAsCount ?? 0;
  if (sa >= 3) s += 10;
  if (sig.hasCanonical ?? false) s += 5;
  if (sig.isHttps ?? true) s += 10;
  if (sig.hasIndexNow) s += 10;
  if (sig.hasTrustpilot) s += 5;
  if (sig.hasCrunchbase) s += 5;
  return Math.min(100, s);
}

function buildRecommendations(sig: GeoSignals, d: { wordCount: number; questionHeadingCount: number; tableCount: number; listCount: number; faqCount: number }): string[] {
  const r: string[] = [];
  if (sig.allowsGPTBot === false) r.push('CRITICAL: Allow GPTBot in robots.txt — ChatGPT cannot index your site');
  if (sig.allowsClaudeBot === false) r.push('CRITICAL: Allow ClaudeBot in robots.txt');
  if (sig.allowsPerplexityBot === false) r.push('CRITICAL: Allow PerplexityBot in robots.txt');
  if (sig.hasSSRContent === false) r.push('CRITICAL: Enable SSR — AI crawlers cannot read client-rendered pages');
  if (!sig.hasLlmsTxt) r.push('HIGH: Add /llms.txt to your root — the AI-native sitemap');
  if (!sig.hasSitemap) r.push('HIGH: Submit sitemap.xml to Google Search Console and Bing Webmaster Tools');
  if (!sig.hasWikidata) r.push('HIGH: Create a Wikidata entity (free — no notability required)');
  if (!sig.hasYouTube) r.push('HIGH: Create a YouTube channel — Gemini weights this 2x more than other platforms');
  if (!sig.hasRedditPresence) r.push('HIGH: Build Reddit presence — 46.7% of Perplexity citations come from Reddit');
  if (!sig.hasAuthor) r.push('HIGH: Add a named human author with author schema to this content');
  if (d.questionHeadingCount === 0) r.push('HIGH: Rewrite H2/H3 headings as questions ("How does X work?") for AI citability');
  if (!sig.schemaType) r.push('HIGH: Set a schema type (BlogPosting, HowTo, FAQPage, Service)');
  if (!sig.hasPublishDate) r.push('MEDIUM: Add a visible publish/update date');
  if (d.faqCount < 3) r.push('MEDIUM: Add an FAQ section with 3+ Q&As — boosts AI citability significantly');
  if (d.tableCount === 0) r.push('MEDIUM: Add a comparison or data table — tables are highly cited by AI models');
  if (d.wordCount < 1500) r.push(`MEDIUM: Increase content depth — ${d.wordCount} words; target 1,500–3,000`);
  if (!sig.hasStatisticsWithCitations) r.push('MEDIUM: Add statistics with linked sources');
  if (!sig.hasOpenGraph) r.push('MEDIUM: Add Open Graph meta tags (og:title, og:description, og:image)');
  if (!sig.hasWikipedia) r.push('LOW: Work toward Wikipedia notability via 3 independent press mentions');
  if (!sig.hasGoogleBusinessProfile) r.push('LOW: Set up / verify Google Business Profile');
  if (!sig.hasTrustpilot) r.push('LOW: Create a Trustpilot profile and collect reviews');
  return r;
}

/** Site-wide brand authority defaults for Reframe Visuals */
export const REFRAME_BRAND_DEFAULTS: Partial<GeoSignals> = {
  hasLinkedIn: true,
  hasGoogleBusinessProfile: true,
  hasTrustpilot: false,
  hasYouTube: false,
  hasRedditPresence: false,
  hasWikipedia: false,
  hasWikidata: false,
  hasCrunchbase: false,
  hasPressmentions: false,
  sameAsCount: 2,
  isHttps: true,
  hasSSRContent: true,
  allowsGPTBot: true,
  allowsClaudeBot: true,
  allowsPerplexityBot: true,
  allowsGoogleExtended: true,
  allowsOAISearchBot: true,
  allowsBingbot: true,
  allowsApplebot: true,
};

export function computeGeoScore(rawSignals: GeoSignals): GeoScoreResult {
  const sig: GeoSignals = { ...REFRAME_BRAND_DEFAULTS, ...rawSignals };
  const content = sig.content || '';

  const wordCount = sig.wordCount ?? countWords(stripMarkdown(content));
  const headings = extractHeadings(content);
  const questionHeadings = headings.filter(
    (h) => h.endsWith('?') || /^(what|how|why|when|where|which|who|can|is|are|does|do)\b/i.test(h)
  );
  const tableCount = sig.hasTables ? Math.max(1, countTables(content)) : countTables(content);
  const listCount = sig.hasLists ? Math.max(1, countLists(content)) : countLists(content);
  const faqCount = sig.hasFaqSection ? Math.max(3, countFaqItems(content)) : countFaqItems(content);

  const d = { wordCount, questionHeadingCount: questionHeadings.length, tableCount, listCount, faqCount };

  const aiCitability = scoreAICitability(sig, d);
  const brandAuthority = scoreBrandAuthority(sig);
  const contentEEAT = scoreContentEEAT(sig, d);
  const technicalGEO = scoreTechnicalGEO(sig);
  const schemaStructuredData = scoreSchema(sig, d);

  const platformScores: GeoPlatformScores = {
    googleAIOverviews: scorePlatformGoogle(sig, d),
    chatGPT: scorePlatformChatGPT(sig, d),
    perplexity: scorePlatformPerplexity(sig, d),
    gemini: scorePlatformGemini(sig, d),
    bingCopilot: scorePlatformBing(sig),
  };

  const platformAvg = Math.round(Object.values(platformScores).reduce((a, b) => a + b, 0) / 5);

  const overall = Math.min(100, Math.round(
    aiCitability * 0.25 + brandAuthority * 0.20 + contentEEAT * 0.20 +
    technicalGEO * 0.15 + schemaStructuredData * 0.10 + platformAvg * 0.10
  ));

  let grade: GeoGrade;
  let gradeColor: string;
  if (overall >= 85) { grade = 'Strong'; gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
  else if (overall >= 70) { grade = 'Good'; gradeColor = 'text-blue-700 bg-blue-50 border-blue-200'; }
  else if (overall >= 40) { grade = 'Fair'; gradeColor = 'text-amber-700 bg-amber-50 border-amber-200'; }
  else { grade = 'Weak'; gradeColor = 'text-red-700 bg-red-50 border-red-200'; }

  return {
    overall, grade, gradeColor,
    breakdown: { aiCitability, brandAuthority, contentEEAT, technicalGEO, schemaStructuredData, platformOptimization: platformAvg },
    platformScores,
    recommendations: buildRecommendations(sig, d),
    wordCount, questionHeadingCount: questionHeadings.length,
    hasQuestionHeadings: questionHeadings.length > 0,
    faqCount, tableCount, listCount,
  };
}

export function geoScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}

export function geoGradeColor(score: number): string {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}
