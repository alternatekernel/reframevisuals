/**
 * Humanize Text Analyzer
 * TypeScript port of: https://github.com/lynote-ai/humanize-text
 *
 * Implements the statistical detection signals from:
 *   src/methodologies/detectors/statistical.py
 * and the AI vocabulary replacement dictionary from:
 *   src/methodologies/postprocess.py
 *
 * Produces a "Human Score" (0–100) — higher means more human-sounding text.
 * Flags exact AI vocabulary words with their suggested human replacements.
 */

// ── AI Vocabulary Dictionary (from postprocess.py) ─────────────────────────
// Maps AI-typical words → array of natural human alternatives
export const AI_VOCAB_REPLACEMENTS: Record<string, string[]> = {
  utilize:        ['use', 'apply', 'work with'],
  facilitate:     ['help', 'support', 'enable'],
  comprehensive:  ['full', 'complete', 'thorough'],
  subsequently:   ['then', 'after that', 'next'],
  furthermore:    ['also', 'plus', 'on top of that'],
  demonstrate:    ['show', 'prove', 'illustrate'],
  implement:      ['build', 'set up', 'put in place'],
  leverage:       ['use', 'take advantage of', 'tap into'],
  optimize:       ['improve', 'fine-tune', 'make better'],
  paradigm:       ['model', 'approach', 'framework'],
  synergy:        ['teamwork', 'combined effect', 'collaboration'],
  methodology:    ['method', 'approach', 'process'],
  innovative:     ['new', 'creative', 'fresh'],
  streamline:     ['simplify', 'speed up', 'smooth out'],
  unprecedented:  ['never seen before', 'unheard of', 'groundbreaking'],
  transformative: ['game-changing', 'revolutionary', 'major'],
  ecosystem:      ['environment', 'landscape', 'space'],
  scalable:       ['flexible', 'expandable', 'growable'],
  robust:         ['strong', 'solid', 'reliable'],
  'cutting-edge': ['latest', 'advanced', 'modern'],
  delve:          ['dig into', 'explore', 'look at'],
  intricate:      ['complex', 'detailed', 'involved'],
  pivotal:        ['key', 'crucial', 'central'],
  encompasses:    ['includes', 'covers', 'involves'],
  elevate:        ['improve', 'raise', 'boost'],
  harness:        ['use', 'capture', 'tap'],
  foster:         ['build', 'grow', 'develop'],
  endeavor:       ['effort', 'attempt', 'try'],
  commence:       ['start', 'begin', 'kick off'],
  ascertain:      ['find out', 'determine', 'confirm'],
  elucidate:      ['explain', 'clarify', 'make clear'],
  culminate:      ['end in', 'result in', 'lead to'],
  permeate:       ['spread through', 'fill', 'run through'],
  underscore:     ['highlight', 'stress', 'point out'],
  prioritize:     ['focus on', 'put first', 'rank'],
  mitigate:       ['reduce', 'limit', 'lessen'],
  holistic:       ['overall', 'complete', 'whole'],
  'in conclusion':    ['to wrap up', 'finally', 'to close'],
  'it is worth noting': ['note that', 'keep in mind', 'importantly'],
  'it is important to note': ['note that', 'importantly'],
  'as a result':  ['so', 'because of this', 'therefore'],
  'in order to':  ['to'],
  'at this point in time': ['now', 'currently', 'at this point'],
  'due to the fact that': ['because', 'since'],
  'in the event that': ['if', 'when'],
  landscape:      ['field', 'area', 'space'],
  groundbreaking: ['major', 'significant', 'new'],
  revolutionary:  ['major', 'significant', 'new'],
  'game-changing':['significant', 'major', 'important'],
  multifaceted:   ['complex', 'varied', 'many-sided'],
  'in-depth':     ['thorough', 'detailed', 'deep'],
  nuanced:        ['subtle', 'detailed', 'complex'],
  robust:         ['strong', 'solid', 'reliable'],
  seamlessly:     ['smoothly', 'easily', 'without friction'],
  empower:        ['help', 'let', 'allow'],
  'drive innovation': ['create new ideas', 'innovate', 'push forward'],
};

// ── Result Interface ─────────────────────────────────────────────────────────

export interface HumanizeAnalysisResult {
  /** 0–100. Higher = more human-sounding, less AI-detectable */
  humanScore: number;
  /** Pass (>=65) | Borderline (>=45) | AI-Detected (<45) */
  grade: 'Pass' | 'Borderline' | 'AI-Detected';
  gradeColor: string;

  /** Raw signal breakdown */
  signals: {
    /** Type-Token Ratio: vocabulary diversity (0–1, higher = more human) */
    ttr: number;
    /** Sentence length variance: rhythm variety (higher = more human) */
    sentenceLengthVariance: number;
    /** Burstiness: mix of very short and long sentences (higher = more human) */
    burstiness: number;
    /** Avg sentence length (ideal 15–25 for blogs) */
    avgSentenceLength: number;
    /** Word count */
    wordCount: number;
  };

  /** AI vocabulary hits: words found + their human replacements */
  aiVocabHits: Array<{
    word: string;
    replacements: string[];
    count: number;
  }>;

  /** Plain-language issues */
  issues: string[];
  /** Things the text already does well */
  good: string[];
}

// ── Core Scorer ──────────────────────────────────────────────────────────────

export function computeHumanizeScore(rawContent: string): HumanizeAnalysisResult {
  const text = (rawContent || '')
    .replace(/<[^>]+>/g, ' ')        // strip HTML
    .replace(/```[\s\S]*?```/g, ' ') // strip code blocks
    .replace(/`[^`]+`/g, ' ')        // strip inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip MD links
    .replace(/[#*_~>]/g, ' ')        // strip MD markup chars
    .replace(/\s+/g, ' ')
    .trim();

  const issues: string[] = [];
  const good: string[] = [];

  if (text.length < 40) {
    return {
      humanScore: 50,
      grade: 'Borderline',
      gradeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      signals: { ttr: 0, sentenceLengthVariance: 0, burstiness: 0, avgSentenceLength: 0, wordCount: 0 },
      aiVocabHits: [],
      issues: ['Text too short to analyze reliably'],
      good: [],
    };
  }

  // ── 1. Type-Token Ratio (TTR) ─────────────────────────────────────────────
  // Vocabulary diversity. AI tends to repeat the same words.
  // Low TTR (<0.45) = likely AI.  High TTR (>0.65) = more human.
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  const wordCount = words.length;
  const uniqueWords = new Set(words);
  const ttr = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  // ── 2. Sentence Length Variance ───────────────────────────────────────────
  // AI produces metronomic, uniform-length sentences. Humans mix short and long.
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 2);

  const sentLengths = sentences.map((s) => s.split(/\s+/).length);
  const avgSentenceLength = sentLengths.length > 0
    ? sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length
    : 0;

  let variance = 0;
  if (sentLengths.length > 1) {
    const mean = avgSentenceLength;
    variance = sentLengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / sentLengths.length;
  }
  const stdDev = Math.sqrt(variance);

  // ── 3. Burstiness ─────────────────────────────────────────────────────────
  // Human writing has "bursts" — very short sentences followed by long ones.
  // We measure the coefficient of variation: stdDev / mean
  const burstiness = avgSentenceLength > 0 ? stdDev / avgSentenceLength : 0;

  // ── 4. AI Vocabulary Scan ─────────────────────────────────────────────────
  const lowerText = text.toLowerCase();
  const aiVocabHits: HumanizeAnalysisResult['aiVocabHits'] = [];

  for (const [aiWord, replacements] of Object.entries(AI_VOCAB_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${aiWord.replace(/-/g, '[- ]')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      aiVocabHits.push({ word: aiWord, replacements, count: matches.length });
    }
  }

  // ── 5. Score Computation ──────────────────────────────────────────────────
  // All signals mapped to 0–100 component scores, then weighted average.

  // TTR score: <0.40 → 0, 0.40–0.55 → linear 0–50, 0.55–0.75 → linear 50–100, >0.75 → 100
  let ttrScore: number;
  if (ttr < 0.40) ttrScore = 0;
  else if (ttr < 0.55) ttrScore = ((ttr - 0.40) / 0.15) * 50;
  else if (ttr < 0.75) ttrScore = 50 + ((ttr - 0.55) / 0.20) * 50;
  else ttrScore = 100;

  // Sentence variance score: stdDev <2 → 0, 2–6 → linear, >6 → 100
  let varianceScore: number;
  if (stdDev < 2) varianceScore = 0;
  else if (stdDev < 6) varianceScore = ((stdDev - 2) / 4) * 100;
  else varianceScore = 100;

  // Burstiness score: <0.25 → 0, 0.25–0.55 → linear, >0.55 → 100
  let burstinessScore: number;
  if (burstiness < 0.25) burstinessScore = 0;
  else if (burstiness < 0.55) burstinessScore = ((burstiness - 0.25) / 0.30) * 100;
  else burstinessScore = 100;

  // AI vocab penalty: each hit reduces by 5 pts (max -40)
  const vocabPenalty = Math.min(40, aiVocabHits.reduce((sum, h) => sum + h.count, 0) * 5);

  // Weighted combination
  const rawScore = (ttrScore * 0.35) + (varianceScore * 0.35) + (burstinessScore * 0.30);
  const humanScore = Math.max(0, Math.min(100, Math.round(rawScore - vocabPenalty)));

  // ── 6. Issues & Good signals ─────────────────────────────────────────────
  if (ttr < 0.50) {
    issues.push(`Low vocabulary diversity (TTR ${(ttr * 100).toFixed(0)}%) — AI detectors flag repetitive word choices`);
  } else {
    good.push(`Good vocabulary diversity (TTR ${(ttr * 100).toFixed(0)}%)`);
  }

  if (stdDev < 3) {
    issues.push(`Uniform sentence length (σ=${stdDev.toFixed(1)} words) — AI detectors look for metronomic rhythm`);
  } else {
    good.push(`Varied sentence lengths (σ=${stdDev.toFixed(1)} words)`);
  }

  if (burstiness < 0.30) {
    issues.push('Low burstiness — mix very short sentences with long ones to sound more human');
  } else {
    good.push('Good sentence rhythm burstiness');
  }

  if (avgSentenceLength > 30) {
    issues.push(`Average sentence too long (${avgSentenceLength.toFixed(0)} words) — break up long sentences`);
  } else if (avgSentenceLength < 8 && wordCount > 50) {
    issues.push(`Sentences very short (avg ${avgSentenceLength.toFixed(0)} words) — add more detail`);
  } else {
    good.push(`Sentence length is balanced (avg ${avgSentenceLength.toFixed(0)} words)`);
  }

  if (aiVocabHits.length > 0) {
    issues.push(`${aiVocabHits.length} AI-typical word${aiVocabHits.length > 1 ? 's' : ''} found — see replacements below`);
  } else {
    good.push('No AI-typical vocabulary detected');
  }

  // ── 7. Grade ─────────────────────────────────────────────────────────────
  let grade: HumanizeAnalysisResult['grade'];
  let gradeColor: string;

  if (humanScore >= 65) {
    grade = 'Pass';
    gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (humanScore >= 45) {
    grade = 'Borderline';
    gradeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else {
    grade = 'AI-Detected';
    gradeColor = 'text-red-700 bg-red-50 border-red-200';
  }

  return {
    humanScore,
    grade,
    gradeColor,
    signals: {
      ttr: Math.round(ttr * 100) / 100,
      sentenceLengthVariance: Math.round(stdDev * 10) / 10,
      burstiness: Math.round(burstiness * 100) / 100,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      wordCount,
    },
    aiVocabHits: aiVocabHits.sort((a, b) => b.count - a.count),
    issues,
    good,
  };
}
