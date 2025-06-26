"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step01_rawTextIn = step01_rawTextIn;
/**
 * Step 01: RAW_TEXT_IN
 * Accept the transcript and validate it
 * Input: transcript → Output: raw_text
 */
function step01_rawTextIn(transcript) {
    // Validate input
    if (typeof transcript !== 'string') {
        throw new Error('Transcript must be a string');
    }
    // Clean and normalize the text
    const raw_text = transcript.trim();
    // Basic validation
    if (raw_text.length === 0) {
        throw new Error('Transcript cannot be empty');
    }
    if (raw_text.length > 5000) {
        throw new Error('Transcript too long (max 5000 characters)');
    }
    // Create partial context with raw_text
    const context = {
        raw_text,
        start_time: Date.now()
    };
    // Create log entry
    const log = {
        tag: 'RAW_TEXT_IN',
        input: `transcript="${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
        output: `raw_text="${raw_text.substring(0, 50)}${raw_text.length > 50 ? '...' : ''}" (${raw_text.length} chars)`,
        note: `Validated and cleaned transcript input`
    };
    return { context, log };
}
//# sourceMappingURL=step01_rawTextIn.js.map