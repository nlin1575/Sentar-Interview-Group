import { PipelineContext, LogEntry } from '../types';
import { maxCosineSimilarity, hasOverlap } from '../utils/cosine';

/**
 * Step 07: CARRY_IN
 * Check if theme/vibe overlap or cosine > 0.86
 * Input: parsed, recent_entries, embedding → Output: carry_in
 */
export function step07_carryIn(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry } {
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
    maxSimilarity = maxCosineSimilarity(embedding, recentEmbeddings);

    // Check theme overlap
    const recentThemes = recent_entries.flatMap(entry => entry.parsed.theme);
    const themeOverlap = hasOverlap(parsed.theme, recentThemes);

    // Check vibe overlap
    const recentVibes = recent_entries.flatMap(entry => entry.parsed.vibe);
    const vibeOverlap = hasOverlap(parsed.vibe, recentVibes);

    // Determine carry_in based on similarity threshold or overlap
    if (maxSimilarity > 0.86) {
      carry_in = true;
      reason = `High cosine similarity: ${maxSimilarity.toFixed(3)}`;
    } else if (themeOverlap) {
      carry_in = true;
      const overlappingThemes = parsed.theme.filter(theme => recentThemes.includes(theme));
      reason = `Theme overlap: [${overlappingThemes.join(', ')}]`;
    } else if (vibeOverlap) {
      carry_in = true;
      const overlappingVibes = parsed.vibe.filter(vibe => recentVibes.includes(vibe));
      reason = `Vibe overlap: [${overlappingVibes.join(', ')}]`;
    } else {
      reason = `No significant overlap (max similarity: ${maxSimilarity.toFixed(3)})`;
    }
  }

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    carry_in
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'CARRY_IN',
    input: `themes=[${parsed.theme.join(', ')}], vibes=[${parsed.vibe.join(', ')}], recent_count=${recent_entries.length}`,
    output: `carry_in=${carry_in}`,
    note: reason
  };

  return { context: updatedContext, log };
}