import { PipelineContext, LogEntry, MetaData } from '../types';
import * as natural from 'natural';
// import * as emojiRegex from 'emoji-regex';

/**
 * Step 05: META_EXTRACT
 * Extract top words, length, punctuation flags
 * Input: raw_text → Output: meta_data
 */
export function step05_metaExtract(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry } {
  if (!context.raw_text) {
    throw new Error('raw_text is required for meta extraction');
  }

  const text = context.raw_text;

  // Extract metadata
  const meta_data: MetaData = {
    word_count: countWords(text),
    char_count: text.length,
    top_words: extractTopWords(text, 5),
    has_exclamation: text.includes('!'),
    has_question: text.includes('?'),
    has_emoji: hasEmoji(text),
    punctuation_density: calculatePunctuationDensity(text)
  };

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    meta_data
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'META_EXTRACT',
    input: `raw_text (${text.length} chars)`,
    output: `meta_data: ${meta_data.word_count} words, top_words=[${meta_data.top_words.slice(0, 3).join(', ')}...]`,
    note: `Using natural.js + emoji-regex | Flags: exclamation=${meta_data.has_exclamation}, question=${meta_data.has_question}, emoji=${meta_data.has_emoji}, punct_density=${meta_data.punctuation_density.toFixed(3)}`
  };

  return { context: updatedContext, log };
}

function countWords(text: string): number {
  // Use natural's tokenizer for more accurate word counting
  const tokens = natural.WordTokenizer.prototype.tokenize(text);
  return tokens ? tokens.filter((token: string) => token.length > 0).length : 0;
}

function extractTopWords(text: string, limit: number): string[] {
  // Tokenize using natural's WordTokenizer
  const tokens = natural.WordTokenizer.prototype.tokenize(text.toLowerCase());
  if (!tokens) {
    return [];
  }

  // Filter out stop words and short words
  const stopWords = new Set(natural.stopwords);
  const meaningfulWords = tokens
    .filter((word: string) => word.length > 2 && !stopWords.has(word))
    .map((word: string) => natural.PorterStemmer.stem(word)); // Group similar words using stemming

  // Count word frequency
  const wordCount: Record<string, number> = {};
  meaningfulWords.forEach((word: string) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and return top words
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

function hasEmoji(text: string): boolean {
  // Simple emoji detection - check for common emoji characters
  return /[\u2600-\u27BF]/.test(text) || // Misc symbols and dingbats
         /[\uD83C-\uDBFF]/.test(text) || // High surrogates
         /[\uDC00-\uDFFF]/.test(text) || // Low surrogates
         text.includes('😀') || text.includes('😊') || text.includes('❤️') ||
         text.includes('👍') || text.includes('🎉') || text.includes('🔥');
}

function calculatePunctuationDensity(text: string): number {
  const punctuationCount = (text.match(/[.,!?;:]/g) || []).length;
  return text.length > 0 ? punctuationCount / text.length : 0;
}