/**
 * Stop-Slop Prose Scorer
 * Based on the stop-slop rules (github.com/hardikpandya/stop-slop)
 *
 * Checks text for common AI writing patterns ("slop"):
 * - Adverbs (ends in -ly)
 * - Passive voice (is/was/been + past participle)
 * - Em-dashes (— or --)
 * - Filler / AI words (delve, tapestry, testament, beacon, not only, furthermore)
 * - Throat-clearing phrases (here's what, in conclusion, it is important to note)
 * - Metronomic sentence rhythm (3+ consecutive sentences with similar length)
 * - Vague declaratives (implications are significant, reasons are structural)
 */

export interface StopSlopResult {
  score: number; // 0 - 50 scale (based on SKILL.md: 5 dimensions * 10 pts)
  score100: number; // Normalized 0 - 100 scale
  grade: 'Pass' | 'Needs Revision';
  gradeColor: string;
  dimensions: {
    directness: number;    // 0-10
    rhythm: number;        // 0-10
    trust: number;         // 0-10
    authenticity: number;  // 0-10
    density: number;       // 0-10
  };
  issues: string[];
  good: string[];
  adverbsFound: string[];
  passivePhrasesFound: string[];
  fillerWordsFound: string[];
}

// Common adjectives/adverbs ending in -ly that are safe/acceptable
const SAFE_LY_WORDS = new Set([
  'only', 'early', 'likely', 'daily', 'weekly', 'monthly', 'yearly', 'friendly',
  'family', 'silly', 'holy', 'fly', 'ugly', 'ally', 'jelly', 'belly', 'rely', 'apply'
]);

// AI filler/announcement words
const AI_FILLER_WORDS = [
  { word: 'delve', label: '"delve"' },
  { word: 'tapestry', label: '"tapestry"' },
  { word: 'testament', label: '"testament"' },
  { word: 'beacon', label: '"beacon"' },
  { word: 'furthermore', label: '"furthermore"' },
  { word: 'moreover', label: '"moreover"' },
  { word: 'nested', label: '"nested"' },
  { word: 'embark', label: '"embark"' },
  { word: 'revolutionize', label: '"revolutionize"' }
];

// Throat-clearing templates
const THROAT_CLEARING_PHRASES = [
  { phrase: /\bhere's what\b/i, label: '"here\'s what"' },
  { phrase: /\bin conclusion\b/i, label: '"in conclusion"' },
  { phrase: /\bit is important to (note|understand|remember)\b/i, label: '"it is important to note"' },
  { phrase: /\blet's take a look\b/i, label: '"let\'s take a look"' },
  { phrase: /\bfirst and foremost\b/i, label: '"first and foremost"' },
  { phrase: /\bneedless to say\b/i, label: '"needless to say"' },
  { phrase: /\bas we can see\b/i, label: '"as we can see"' }
];

export function computeStopSlopScore(content: string): StopSlopResult {
  const issues: string[] = [];
  const good: string[] = [];
  const cleanContent = (content || '')
    .replace(/<[^>]+>/g, ' ') // Strip HTML tags
    .replace(/```[\s\S]*?```/g, ' ') // Strip code blocks
    .replace(/`[^`]+`/g, ' ') // Strip inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Strip MD links

  // Split into sentences
  const sentences = cleanContent
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  let directness = 10;
  let rhythm = 10;
  let trust = 10;
  let authenticity = 10;
  let density = 10;

  // 1. Adverbs check
  const words = cleanContent.toLowerCase().match(/\b\w+ly\b/g) || [];
  const adverbsFound = Array.from(new Set(words.filter((w) => !SAFE_LY_WORDS.has(w))));
  if (adverbsFound.length > 0) {
    const penalty = Math.min(6, adverbsFound.length * 1.5);
    density -= penalty;
    issues.push(`Contains ${adverbsFound.length} adverbs: ${adverbsFound.slice(0, 5).join(', ')}`);
  } else {
    good.push('Direct & clean: no adverbs (-ly words) found');
  }

  // 2. Em-dash check
  const hasEmDash = /—|--/.test(content);
  if (hasEmDash) {
    rhythm -= 2;
    issues.push('Contains em-dashes (— or --) which disrupt rhythm');
  } else {
    good.push('No em-dashes used');
  }

  // 3. AI Fillers & Throat-clearing
  const fillerWordsFound: string[] = [];
  AI_FILLER_WORDS.forEach(({ word, label }) => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(cleanContent)) {
      fillerWordsFound.push(label);
    }
  });
  THROAT_CLEARING_PHRASES.forEach(({ phrase, label }) => {
    if (phrase.test(cleanContent)) {
      fillerWordsFound.push(label);
    }
  });

  if (fillerWordsFound.length > 0) {
    const penalty = Math.min(6, fillerWordsFound.length * 2);
    authenticity -= penalty;
    issues.push(`Uses AI filler/announcement phrases: ${fillerWordsFound.join(', ')}`);
  } else {
    good.push('Free of AI filler words (like "delve" or "tapestry")');
  }

  // 4. Passive Voice
  // matches is/was/been/be/were + past participle (ends in ed or common irregulars)
  const passiveRegex = /\b(is|am|are|was|were|be|been|being|get|gets|got|getting)\s+(\w+ed|done|taken|written|seen|chosen|known|given|held|made|built|kept)\b/gi;
  const passiveMatches = cleanContent.match(passiveRegex) || [];
  const passivePhrasesFound = Array.from(new Set(passiveMatches.map((m) => m.toLowerCase())));
  if (passivePhrasesFound.length > 0) {
    const penalty = Math.min(5, passivePhrasesFound.length * 1.5);
    trust -= penalty;
    issues.push(`Passive voice detected: "${passivePhrasesFound.slice(0, 3).join('", "')}"`);
  } else {
    good.push('Active voice: no passive voice constructions found');
  }

  // 5. Metronomic sentence length (Rhythm check)
  let metronomicRhythm = false;
  if (sentences.length >= 3) {
    const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
    for (let i = 0; i < sentenceLengths.length - 2; i++) {
      const len1 = sentenceLengths[i];
      const len2 = sentenceLengths[i + 1];
      const len3 = sentenceLengths[i + 2];
      // If 3 consecutive sentences have nearly identical lengths (within 2 words of each other)
      if (Math.abs(len1 - len2) <= 2 && Math.abs(len2 - len3) <= 2) {
        metronomicRhythm = true;
        break;
      }
    }
  }

  if (metronomicRhythm) {
    rhythm -= 3;
    issues.push('Monotonous sentence rhythm: 3+ consecutive sentences have matching lengths');
  } else if (sentences.length > 0) {
    good.push('Varied sentence length and rhythm');
  }

  // 6. Vague declaratives
  const vagueRegex = /\b(reasons are structural|implications are significant|impact is massive)\b/i;
  if (vagueRegex.test(cleanContent)) {
    directness -= 3;
    issues.push('Contains vague declaratives (e.g. "implications are significant")');
  }

  // Double contrasts ("not only... but also")
  if (/\bnot only\b.*\bbut also\b/i.test(cleanContent)) {
    directness -= 2;
    issues.push('Uses indirect double contrast "not only... but also"');
  }

  // Ensure score constraints
  directness = Math.max(1, Math.round(directness));
  rhythm = Math.max(1, Math.round(rhythm));
  trust = Math.max(1, Math.round(trust));
  authenticity = Math.max(1, Math.round(authenticity));
  density = Math.max(1, Math.round(density));

  const score = directness + rhythm + trust + authenticity + density;
  const score100 = Math.round((score / 50) * 100);
  const grade = score >= 35 ? 'Pass' : 'Needs Revision';
  const gradeColor = score >= 35 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200';

  return {
    score,
    score100,
    grade,
    gradeColor,
    dimensions: {
      directness,
      rhythm,
      trust,
      authenticity,
      density
    },
    issues,
    good,
    adverbsFound,
    passivePhrasesFound,
    fillerWordsFound
  };
}
