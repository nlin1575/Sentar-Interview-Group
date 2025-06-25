import { PipelineContext, LogEntry, UserProfile } from '../types';

/**
 * Step 09: PROFILE_UPDATE
 * Mutate profile fields
 * Input: parsed, profile → Output: updated profile
 */
export function step09_profileUpdate(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry } {
  if (!context.parsed || !context.profile) {
    throw new Error('parsed and profile are required for profile update');
  }

  const { parsed, profile } = context;

  // Create a deep copy of the profile to avoid mutation
  const updatedProfile: UserProfile = JSON.parse(JSON.stringify(profile));

  // Update theme counts
  parsed.theme.forEach(theme => {
    updatedProfile.theme_count[theme] = (updatedProfile.theme_count[theme] || 0) + 1;
  });

  // Update vibe counts
  parsed.vibe.forEach(vibe => {
    updatedProfile.vibe_count[vibe] = (updatedProfile.vibe_count[vibe] || 0) + 1;
  });

  // Update bucket counts
  parsed.bucket.forEach(bucket => {
    updatedProfile.bucket_count[bucket] = (updatedProfile.bucket_count[bucket] || 0) + 1;
  });

  // Update trait pool (add new traits, keep unique)
  const newTraits = parsed.persona_trait.filter(trait => !updatedProfile.trait_pool.includes(trait));
  updatedProfile.trait_pool = [...updatedProfile.trait_pool, ...newTraits].slice(0, 10); // Keep top 10

  // Update entry count
  updatedProfile.entry_count += 1;

  // Recalculate top themes (top 4)
  updatedProfile.top_themes = Object.entries(updatedProfile.theme_count)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)
    .map(([theme]) => theme);

  // Recalculate dominant vibe
  const sortedVibes = Object.entries(updatedProfile.vibe_count)
    .sort(([,a], [,b]) => b - a);

  if (sortedVibes.length > 0) {
    updatedProfile.dominant_vibe = sortedVibes[0][0];
  }

  // Update last theme
  updatedProfile.last_theme = parsed.theme[0] || updatedProfile.last_theme;

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    profile: updatedProfile
  };

  // Create log entry
  const changes = [];
  if (profile.dominant_vibe !== updatedProfile.dominant_vibe) {
    changes.push(`dominant_vibe: "${profile.dominant_vibe}" → "${updatedProfile.dominant_vibe}"`);
  }
  changes.push(`entry_count: ${profile.entry_count} → ${updatedProfile.entry_count}`);

  const log: LogEntry = {
    tag: 'PROFILE_UPDATE',
    input: `themes=[${parsed.theme.join(', ')}], vibes=[${parsed.vibe.join(', ')}], traits=[${parsed.persona_trait.join(', ')}]`,
    output: `updated profile (${updatedProfile.entry_count} entries)`,
    note: changes.length > 0 ? changes.join(', ') : 'Profile updated with new entry data'
  };

  return { context: updatedContext, log };
}