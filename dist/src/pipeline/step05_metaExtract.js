"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.step05_metaExtract = step05_metaExtract;
const natural = __importStar(require("natural"));
// import * as emojiRegex from 'emoji-regex';
/**
 * Step 05: META_EXTRACT
 * Extract top words, length, punctuation flags
 * Input: raw_text → Output: meta_data
 */
function step05_metaExtract(context) {
    if (!context.raw_text) {
        throw new Error('raw_text is required for meta extraction');
    }
    const text = context.raw_text;
    // Extract metadata
    const meta_data = {
        word_count: countWords(text),
        char_count: text.length,
        top_words: extractTopWords(text, 5),
        has_exclamation: text.includes('!'),
        has_question: text.includes('?'),
        has_emoji: hasEmoji(text),
        punctuation_density: calculatePunctuationDensity(text)
    };
    // Update context
    const updatedContext = {
        ...context,
        meta_data
    };
    // Create log entry
    const log = {
        tag: 'META_EXTRACT',
        input: `raw_text (${text.length} chars)`,
        output: `meta_data: ${meta_data.word_count} words, top_words=[${meta_data.top_words.slice(0, 3).join(', ')}...]`,
        note: `Using natural.js + emoji-regex | Flags: exclamation=${meta_data.has_exclamation}, question=${meta_data.has_question}, emoji=${meta_data.has_emoji}, punct_density=${meta_data.punctuation_density.toFixed(3)}`
    };
    return { context: updatedContext, log };
}
function countWords(text) {
    // Handle edge cases
    if (!text || text.trim().length === 0)
        return 0;
    // Use natural's tokenizer for more accurate word counting
    try {
        const tokens = natural.WordTokenizer.prototype.tokenize(text);
        return tokens ? tokens.filter((token) => token.length > 0 && /\w/.test(token)).length : 0;
    }
    catch (error) {
        // Fallback to simple word counting if tokenizer fails
        return text.trim().split(/\s+/).filter(word => word.length > 0 && /\w/.test(word)).length;
    }
}
function extractTopWords(text, limit) {
    // Handle edge cases
    if (!text || text.trim().length === 0)
        return [];
    try {
        // Tokenize using natural's WordTokenizer
        const tokens = natural.WordTokenizer.prototype.tokenize(text.toLowerCase());
        if (!tokens || tokens.length === 0) {
            return [];
        }
        // Filter out stop words and short words
        const stopWords = new Set(natural.stopwords);
        const meaningfulWords = tokens
            .filter((word) => word.length > 2 && !stopWords.has(word) && /\w/.test(word))
            .map((word) => {
            try {
                return natural.PorterStemmer.stem(word); // Group similar words using stemming
            }
            catch {
                return word; // Fallback if stemming fails
            }
        });
        // Count word frequency
        const wordCount = {};
        meaningfulWords.forEach((word) => {
            if (word && word.length > 0) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
        // Sort by frequency and return top words
        return Object.entries(wordCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([word]) => word);
    }
    catch (error) {
        // Fallback to simple word extraction if natural.js fails
        const words = text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && /\w/.test(word))
            .slice(0, limit);
        return [...new Set(words)]; // Remove duplicates
    }
}
function hasEmoji(text) {
    // Comprehensive emoji detection using Unicode ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu;
    return emojiRegex.test(text);
}
function calculatePunctuationDensity(text) {
    const punctuationCount = (text.match(/[.,!?;:]/g) || []).length;
    return text.length > 0 ? punctuationCount / text.length : 0;
}
//# sourceMappingURL=step05_metaExtract.js.map