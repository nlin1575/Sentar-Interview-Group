import { DiaryEntry, UserProfile } from '../types';
declare class InMemoryDatabase {
    private entries;
    private profiles;
    private userEntries;
    saveEntry(entry: DiaryEntry, userId?: string): void;
    getEntry(entryId: string): DiaryEntry | undefined;
    getRecentEntries(userId?: string, limit?: number): DiaryEntry[];
    getAllEntries(userId?: string): DiaryEntry[];
    saveProfile(profile: UserProfile, userId?: string): void;
    getProfile(userId?: string): UserProfile | undefined;
    getEntryCount(userId?: string): number;
    clear(): void;
    initializeMockData(userId?: string, entryCount?: number): void;
    private createProfileFromEntries;
}
export declare const db: InMemoryDatabase;
export {};
//# sourceMappingURL=index.d.ts.map