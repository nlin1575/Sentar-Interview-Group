import { PipelineContext, LogEntry, MetaData } from '../types';
import * as natural from 'natural';

/* Create one tokenizer instance (natural.WordTokenizer) */
const tokenizer = new natural.WordTokenizer();

/* -----------------------------------------------------------------
   Step 05: META_EXTRACT
   ----------------------------------------------------------------- */
export function step05_metaExtract(
  context: Partial<PipelineContext>
): { context: Partial<PipelineContext>; log: LogEntry } {
  if (!context.raw_text) {
    throw new Error('raw_text is required for meta extraction');
  }

  const text = context.raw_text;

  /* Build metadata */
  const meta_data: MetaData = {
    word_count: countWords(text),
    char_count: text.length,
    top_words: extractTopWords(text, 5),
    has_exclamation: text.includes('!'),
    has_question: text.includes('?'),
    has_emoji: hasEmoji(text),
    punctuation_density: calculatePunctuationDensity(text)
  };

  /* Update context */
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    meta_data
  };

  /* Log entry */
  const log: LogEntry = {
    tag: 'META_EXTRACT',
    input: `raw_text (${text.length} chars)`,
    output: `meta_data: ${meta_data.word_count} words, top_words=[${meta_data.top_words
      .slice(0, 3)
      .join(', ')}...]`,
    note: `Using natural.js tokenizer | Flags: exclamation=${meta_data.has_exclamation}, question=${meta_data.has_question}, emoji=${meta_data.has_emoji}, punct_density=${meta_data.punctuation_density.toFixed(
      3
    )}`
  };

  return { context: updatedContext, log };
}

/* ---------- helpers ---------- */
function countWords(text: string): number {
  if (!text.trim()) return 0;

  try {
    const tokens = tokenizer.tokenize(text) as string[];
    return tokens.filter(tok => /\w/.test(tok)).length;
  } catch {
    return text
      .trim()
      .split(/\s+/)
      .filter(w => /\w/.test(w)).length;
  }
}

function extractTopWords(text: string, limit: number): string[] {
  if (!text.trim()) return [];

  try {
    const tokens = tokenizer.tokenize(text.toLowerCase()) as string[];

    const stopWords = new Set(natural.stopwords);
    const meaningful = tokens
      .filter(w => w.length > 2 && !stopWords.has(w) && /\w/.test(w))
      .map(w => {
        try {
          return natural.PorterStemmer.stem(w);
        } catch {
          return w;
        }
      });

    const freq: Record<string, number> = {};
    for (const w of meaningful) freq[w] = (freq[w] || 0) + 1;

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([w]) => w);
  } catch {
    return [...new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && /\w/.test(w))
    )].slice(0, limit);
  }
}

function hasEmoji(text: string): boolean {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu;
  return emojiRegex.test(text);
}

function calculatePunctuationDensity(text: string): number {
  const punct = (text.match(/[.,!?;:]/g) || []).length;
  return text.length ? punct / text.length : 0;
}








