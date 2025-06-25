import { PipelineContext, LogEntry, UserProfile } from '../types';
import { db } from '../db';

/**
 * Step 04: FETCH_PROFILE
 * Load or initialize user profile
 * Input: → Output: profile
 */
export function step04_fetchProfile(context: Partial<PipelineContext>, userId: string = 'default'): { context: Partial<PipelineContext>, log: LogEntry } {
  // Try to fetch existing profile
  let profile = db.getProfile(userId);
  let isNewProfile = false;

  // Initialize new profile if none exists
  if (!profile) {
    profile = createEmptyProfile();
    isNewProfile = true;
  }

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    profile
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'FETCH_PROFILE',
    input: `userId="${userId}"`,
    output: `profile loaded (${profile.entry_count} entries)`,
    note: isNewProfile
      ? 'Initialized new empty profile for first-time user'
      : `Loaded existing profile: dominant_vibe="${profile.dominant_vibe}", top_themes=[${profile.top_themes.slice(0, 2).join(', ')}...]`
  };

  return { context: updatedContext, log };
}

function createEmptyProfile(): UserProfile {
  return {
    top_themes: [],
    theme_count: {},
    dominant_vibe: 'neutral',
    vibe_count: {},
    bucket_count: {},
    trait_pool: [],
    last_theme: '',
    entry_count: 0
  };
}