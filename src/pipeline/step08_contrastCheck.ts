import { PipelineContext, LogEntry } from '../types';

/**
 * Step 08: CONTRAST_CHECK
 * Compare new vibe vs dominant profile vibe
 * Input: parsed, profile → Output: emotion_flip
 */
export function step08_contrastCheck(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry } {
  if (!context.parsed || !context.profile) {
    throw new Error('parsed and profile are required for contrast check');
  }

  const { parsed, profile } = context;

  let emotion_flip = false;
  let reason = 'No contrast detected';

  // Skip contrast check for new users with no dominant vibe
  if (profile.entry_count === 0 || profile.dominant_vibe === 'neutral') {
    reason = 'New user - no established dominant vibe';
  } else {
    // Check if current vibes contrast with dominant vibe
    const currentVibes = parsed.vibe;
    const dominantVibe = profile.dominant_vibe;

    // Define contrasting emotion pairs
    const contrastPairs: Record<string, string[]> = {
      'happy': ['sad', 'frustrated', 'anxious'],
      'sad': ['happy', 'excited', 'confident'],
      'excited': ['exhausted', 'sad', 'frustrated'],
      'exhausted': ['excited', 'energetic', 'driven'],
      'confident': ['anxious', 'insecure', 'worried'],
      'anxious': ['confident', 'calm', 'relaxed'],
      'driven': ['exhausted', 'unmotivated', 'lazy'],
      'frustrated': ['happy', 'content', 'satisfied'],
      'curious': ['bored', 'disinterested', 'apathetic'],
      'grateful': ['ungrateful', 'resentful', 'bitter']
    };

    // Check if any current vibe contrasts with dominant vibe
    const contrastingVibes = contrastPairs[dominantVibe] || [];
    const hasContrast = currentVibes.some(vibe => contrastingVibes.includes(vibe));

    if (hasContrast) {
      emotion_flip = true;
      const flippedVibes = currentVibes.filter(vibe => contrastingVibes.includes(vibe));
      reason = `Emotion flip detected: ${dominantVibe} → [${flippedVibes.join(', ')}]`;
    } else {
      reason = `No contrast: current [${currentVibes.join(', ')}] aligns with dominant "${dominantVibe}"`;
    }
  }

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    emotion_flip
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'CONTRAST_CHECK',
    input: `current_vibes=[${parsed.vibe.join(', ')}], dominant_vibe="${profile.dominant_vibe}"`,
    output: `emotion_flip=${emotion_flip}`,
    note: reason
  };

  return { context: updatedContext, log };
}