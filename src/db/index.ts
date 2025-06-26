import { DiaryEntry, UserProfile } from '../types';

// In-memory storage for the pipeline
class InMemoryDatabase {
  private entries: Map<string, DiaryEntry> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private userEntries: Map<string, string[]> = new Map(); // userId -> entryIds

  // Entry operations
  saveEntry(entry: DiaryEntry, userId: string = 'default'): void {
    this.entries.set(entry.id, entry);

    if (!this.userEntries.has(userId)) {
      this.userEntries.set(userId, []);
    }
    this.userEntries.get(userId)!.push(entry.id);
  }

  getEntry(entryId: string): DiaryEntry | undefined {
    return this.entries.get(entryId);
  }

  getRecentEntries(userId: string = 'default', limit: number = 5): DiaryEntry[] {
    const entryIds = this.userEntries.get(userId) || [];
    const recentIds = entryIds.slice(-limit);

    return recentIds
      .map(id => this.entries.get(id))
      .filter((entry): entry is DiaryEntry => entry !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAllEntries(userId: string = 'default'): DiaryEntry[] {
    const entryIds = this.userEntries.get(userId) || [];
    return entryIds
      .map(id => this.entries.get(id))
      .filter((entry): entry is DiaryEntry => entry !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Profile operations
  saveProfile(profile: UserProfile, userId: string = 'default'): void {
    this.profiles.set(userId, profile);
  }

  getProfile(userId: string = 'default'): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  // Utility methods
  getEntryCount(userId: string = 'default'): number {
    return this.userEntries.get(userId)?.length || 0;
  }

  clear(): void {
    this.entries.clear();
    this.profiles.clear();
    this.userEntries.clear();
  }

  // Private helper to generate mock entries
  private _generateMockEntries(userId: string, count: number, startNum: number = 0): void {
    const mockThemes = ['work-life balance', 'productivity', 'startup culture', 'intern management', 'personal growth'];
    const mockVibes = ['driven', 'curious', 'overwhelmed', 'excited', 'anxious', 'confident'];
    const mockTraits = ['organiser', 'builder', 'mentor', 'analytical', 'creative'];
    const mockBuckets = ['Goal', 'Thought', 'Hobby', 'Value', 'Reflection'];

    for (let i = 0; i < count; i++) {
      const theme = mockThemes[Math.floor(Math.random() * mockThemes.length)];
      const vibe = mockVibes[Math.floor(Math.random() * mockVibes.length)];
      const trait = mockTraits[Math.floor(Math.random() * mockTraits.length)];
      const bucket = mockBuckets[Math.floor(Math.random() * mockBuckets.length)];

      const entry: DiaryEntry = {
        id: `mock-entry-${startNum + i + 1}`,
        raw_text: `Mock diary entry ${startNum + i + 1} about ${theme}. Feeling ${vibe} today.`,
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
        timestamp: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
        carry_in: Math.random() > 0.7,
        emotion_flip: Math.random() > 0.8
      };

      this.saveEntry(entry, userId);
    }

    // Update profile
    const allEntries = this.getAllEntries(userId);
    const profile = this.createProfileFromEntries(allEntries);
    this.saveProfile(profile, userId);
  }

  // Initialize with mock data for testing
  initializeMockData(userId: string = 'default', entryCount: number = 99): void {
    this.clear();
    this._generateMockEntries(userId, entryCount, 0);
  }

  // Add mock entries without clearing
  addMockEntries(userId: string = 'default', count: number = 1): void {
    // Use profile.entry_count as maxNum if available
    const profile = this.getProfile(userId);
    console.log(`profile: ${JSON.stringify(profile,null,2)}`);
    const maxNum = db.getEntryCount(userId);
    
    console.log(`count: ${count} maxNum: ${maxNum} `);
    this._generateMockEntries(userId, count, maxNum);
  }

  clearUser(userId: string): void {
    // Remove all entry IDs for this user
    const entryIds = this.userEntries.get(userId) || [];
    // Remove each entry from the global entries map
    entryIds.forEach(id => {
      this.entries.delete(id);
    });
    this.userEntries.delete(userId);
    this.profiles.delete(userId);
  }

  private createProfileFromEntries(entries: DiaryEntry[]): UserProfile {
    const themeCount: Record<string, number> = {};
    const vibeCount: Record<string, number> = {};
    const bucketCount: Record<string, number> = {};
    const traitSet = new Set<string>();

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
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([theme]) => theme);

    const dominantVibe = Object.entries(vibeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

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
export const db = new InMemoryDatabase();