"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step04_fetchProfile = step04_fetchProfile;
const db_1 = require("../db");
/**
 * Step 04: FETCH_PROFILE
 * Load or initialize user profile
 * Input: → Output: profile
 */
function step04_fetchProfile(context, userId = 'default') {
    // Try to fetch existing profile
    let profile = db_1.db.getProfile(userId);
    let isNewProfile = false;
    // Initialize new profile if none exists
    if (!profile) {
        profile = createEmptyProfile();
        isNewProfile = true;
    }
    // Update context
    const updatedContext = {
        ...context,
        profile
    };
    // Create log entry
    const log = {
        tag: 'FETCH_PROFILE',
        input: `userId="${userId}"`,
        output: `profile loaded (${profile.entry_count} entries)`,
        note: isNewProfile
            ? 'Initialized new empty profile for first-time user'
            : `Loaded existing profile: dominant_vibe="${profile.dominant_vibe}", top_themes=[${profile.top_themes.slice(0, 2).join(', ')}...]`
    };
    return { context: updatedContext, log };
}
function createEmptyProfile() {
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
//# sourceMappingURL=step04_fetchProfile.js.map