"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step07_carryIn = step07_carryIn;
const cosine_1 = require("../utils/cosine");
/**
 * Step 07: CARRY_IN
 * Check if theme/vibe overlap or cosine > 0.86
 * Input: parsed, recent_entries, embedding → Output: carry_in
 */
function step07_carryIn(context) {
    if (!context.parsed || !context.recent_entries || !context.embedding) {
        throw new Error('parsed, recent_entries, and embedding are required for carry_in check');
    }
    const { parsed, recent_entries, embedding } = context;
    let carry_in = false;
    let reason = 'No recent entries';
    let maxSimilarity = 0;
    if (recent_entries.length > 0) {
        // Check cosine similarity with recent embeddings
        const recentEmbeddings = recent_entries.map(entry => entry.embedding);
        maxSimilarity = (0, cosine_1.maxCosineSimilarity)(embedding, recentEmbeddings);
        // Check theme overlap
        const recentThemes = recent_entries.flatMap(entry => entry.parsed.theme);
        const themeOverlap = (0, cosine_1.hasOverlap)(parsed.theme, recentThemes);
        // Check vibe overlap
        const recentVibes = recent_entries.flatMap(entry => entry.parsed.vibe);
        const vibeOverlap = (0, cosine_1.hasOverlap)(parsed.vibe, recentVibes);
        // Determine carry_in based on similarity threshold or overlap
        if (maxSimilarity > 0.86) {
            carry_in = true;
            reason = `High cosine similarity: ${maxSimilarity.toFixed(3)}`;
        }
        else if (themeOverlap) {
            carry_in = true;
            const overlappingThemes = parsed.theme.filter(theme => recentThemes.includes(theme));
            reason = `Theme overlap: [${overlappingThemes.join(', ')}]`;
        }
        else if (vibeOverlap) {
            carry_in = true;
            const overlappingVibes = parsed.vibe.filter(vibe => recentVibes.includes(vibe));
            reason = `Vibe overlap: [${overlappingVibes.join(', ')}]`;
        }
        else {
            reason = `No significant overlap (max similarity: ${maxSimilarity.toFixed(3)})`;
        }
    }
    // Update context
    const updatedContext = {
        ...context,
        carry_in
    };
    // Create log entry
    const log = {
        tag: 'CARRY_IN',
        input: `themes=[${parsed.theme.join(', ')}], vibes=[${parsed.vibe.join(', ')}], recent_count=${recent_entries.length}`,
        output: `carry_in=${carry_in}`,
        note: reason
    };
    return { context: updatedContext, log };
}
//# sourceMappingURL=step07_carryIn.js.map