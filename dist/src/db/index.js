"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// In-memory storage for the pipeline
class InMemoryDatabase {
    constructor() {
        this.entries = new Map();
        this.profiles = new Map();
        this.userEntries = new Map(); // userId -> entryIds
    }
    // Entry operations
    saveEntry(entry, userId = 'default') {
        this.entries.set(entry.id, entry);
        if (!this.userEntries.has(userId)) {
            this.userEntries.set(userId, []);
        }
        this.userEntries.get(userId).push(entry.id);
    }
    getEntry(entryId) {
        return this.entries.get(entryId);
    }
    getRecentEntries(userId = 'default', limit = 5) {
        const entryIds = this.userEntries.get(userId) || [];
        const recentIds = entryIds.slice(-limit);
        return recentIds
            .map(id => this.entries.get(id))
            .filter((entry) => entry !== undefined)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getAllEntries(userId = 'default') {
        const entryIds = this.userEntries.get(userId) || [];
        return entryIds
            .map(id => this.entries.get(id))
            .filter((entry) => entry !== undefined)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    // Profile operations
    saveProfile(profile, userId = 'default') {
        this.profiles.set(userId, profile);
    }
    getProfile(userId = 'default') {
        return this.profiles.get(userId);
    }
    // Utility methods
    getEntryCount(userId = 'default') {
        return this.userEntries.get(userId)?.length || 0;
    }
    clear() {
        this.entries.clear();
        this.profiles.clear();
        this.userEntries.clear();
    }
    // Initialize with mock data for testing
    initializeMockData(userId = 'default', entryCount = 99) {
        this.clear();
        const mockThemes = ['work-life balance', 'productivity', 'startup culture', 'intern management', 'personal growth'];
        const mockVibes = ['driven', 'curious', 'overwhelmed', 'excited', 'anxious', 'confident'];
        const mockTraits = ['organiser', 'builder', 'mentor', 'analytical', 'creative'];
        const mockBuckets = ['Goal', 'Thought', 'Hobby', 'Value', 'Reflection'];
        for (let i = 0; i < entryCount; i++) {
            const theme = mockThemes[Math.floor(Math.random() * mockThemes.length)];
            const vibe = mockVibes[Math.floor(Math.random() * mockVibes.length)];
            const trait = mockTraits[Math.floor(Math.random() * mockTraits.length)];
            const bucket = mockBuckets[Math.floor(Math.random() * mockBuckets.length)];
            const entry = {
                id: `mock-entry-${i + 1}`,
                raw_text: `Mock diary entry ${i + 1} about ${theme}. Feeling ${vibe} today.`,
                embedding: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
                meta_data: {
                    word_count: 10 + Math.floor(Math.random() * 20),
                    char_count: 50 + Math.floor(Math.random() * 100),
                    top_words: ['mock', 'entry', theme],
                    has_exclamation: Math.random() > 0.7,
                    has_question: Math.random() > 0.8,
                    has_emoji: Math.random() > 0.6,
                    punctuation_density: Math.random() * 0.1
                },
                parsed: {
                    theme: [theme],
                    vibe: [vibe],
                    intent: `Mock intent for ${theme}`,
                    subtext: `Mock subtext about ${vibe} feelings`,
                    persona_trait: [trait],
                    bucket: [bucket]
                },
                timestamp: new Date(Date.now() - (entryCount - i) * 24 * 60 * 60 * 1000),
                carry_in: Math.random() > 0.7,
                emotion_flip: Math.random() > 0.8
            };
            this.saveEntry(entry, userId);
        }
        // Create aggregated profile
        const allEntries = this.getAllEntries(userId);
        const profile = this.createProfileFromEntries(allEntries);
        this.saveProfile(profile, userId);
    }
    createProfileFromEntries(entries) {
        const themeCount = {};
        const vibeCount = {};
        const bucketCount = {};
        const traitSet = new Set();
        entries.forEach(entry => {
            entry.parsed.theme.forEach(theme => {
                themeCount[theme] = (themeCount[theme] || 0) + 1;
            });
            entry.parsed.vibe.forEach(vibe => {
                vibeCount[vibe] = (vibeCount[vibe] || 0) + 1;
            });
            entry.parsed.bucket.forEach(bucket => {
                bucketCount[bucket] = (bucketCount[bucket] || 0) + 1;
            });
            entry.parsed.persona_trait.forEach(trait => {
                traitSet.add(trait);
            });
        });
        const sortedThemes = Object.entries(themeCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([theme]) => theme);
        const dominantVibe = Object.entries(vibeCount)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
        const lastTheme = entries[0]?.parsed.theme[0] || '';
        return {
            top_themes: sortedThemes,
            theme_count: themeCount,
            dominant_vibe: dominantVibe,
            vibe_count: vibeCount,
            bucket_count: bucketCount,
            trait_pool: Array.from(traitSet).slice(0, 5),
            last_theme: lastTheme,
            entry_count: entries.length
        };
    }
}
// Singleton instance
exports.db = new InMemoryDatabase();
//# sourceMappingURL=index.js.map