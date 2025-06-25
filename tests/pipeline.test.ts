import { runPipeline } from '../src/runPipeline';
import { db } from '../src/db';

describe('Pipeline Integration', () => {
  beforeEach(() => {
    // Clear database before each test
    db.clear();
  });

  test('should complete full pipeline for first entry', async () => {
    const transcript = "I'm excited to start learning TypeScript!";
    
    const result = await runPipeline(transcript, 'test-user');
    
    expect(result.entryId).toBeDefined();
    expect(result.response_text).toBeDefined();
    expect(result.response_text.length).toBeLessThanOrEqual(55);
    expect(typeof result.carry_in).toBe('boolean');
    expect(result.updated_profile).toBeDefined();
    expect(result.updated_profile.entry_count).toBe(1);
    expect(result.execution_time).toBeGreaterThan(0);
    expect(result.total_cost).toBeGreaterThan(0);
  });

  test('should handle 100th entry with existing profile', async () => {
    // Initialize with 99 mock entries
    db.initializeMockData('test-user-100', 99);
    
    const transcript = "I'm feeling overwhelmed but proud of the team's progress.";
    
    const result = await runPipeline(transcript, 'test-user-100');
    
    expect(result.entryId).toBeDefined();
    expect(result.response_text).toBeDefined();
    expect(result.updated_profile.entry_count).toBe(100);
    expect(result.updated_profile.dominant_vibe).toBeDefined();
    expect(result.updated_profile.top_themes.length).toBeGreaterThan(0);
  });

  test('should generate different responses for different contexts', async () => {
    const transcript1 = "I'm anxious about the presentation tomorrow.";
    const transcript2 = "I'm excited about the new project!";
    
    const result1 = await runPipeline(transcript1, 'user1');
    const result2 = await runPipeline(transcript2, 'user2');
    
    expect(result1.response_text).not.toBe(result2.response_text);
  });

  test('should handle edge cases gracefully', async () => {
    const shortTranscript = "Hi.";
    const longTranscript = "This is a very long transcript that goes on and on about many different topics and themes and should still be processed correctly by the pipeline even though it's quite lengthy and contains multiple sentences with various punctuation marks and emotional indicators.";
    
    const result1 = await runPipeline(shortTranscript, 'edge1');
    const result2 = await runPipeline(longTranscript, 'edge2');
    
    expect(result1.entryId).toBeDefined();
    expect(result2.entryId).toBeDefined();
    expect(result1.response_text.length).toBeLessThanOrEqual(55);
    expect(result2.response_text.length).toBeLessThanOrEqual(55);
  });
});
