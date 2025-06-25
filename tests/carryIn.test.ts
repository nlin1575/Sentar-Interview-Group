import { step07_carryIn } from '../src/pipeline/step07_carryIn';
import { PipelineContext, DiaryEntry, ParsedEntry } from '../src/types';

describe('Step 07: Carry-In Logic', () => {
  const mockEmbedding = Array.from({ length: 384 }, () => Math.random() * 2 - 1);

  const createMockEntry = (themes: string[], vibes: string[], embedding: number[]): DiaryEntry => ({
    id: 'test-entry',
    raw_text: 'Test entry',
    embedding,
    meta_data: {
      word_count: 10,
      char_count: 50,
      top_words: ['test'],
      has_exclamation: false,
      has_question: false,
      has_emoji: false,
      punctuation_density: 0.1
    },
    parsed: {
      theme: themes,
      vibe: vibes,
      intent: 'Test intent',
      subtext: 'Test subtext',
      persona_trait: ['test'],
      bucket: ['Thought']
    },
    timestamp: new Date(),
    carry_in: false,
    emotion_flip: false
  });

  test('should return carry_in=true when themes overlap', () => {
    const differentEmbedding = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    const context: Partial<PipelineContext> = {
      parsed: {
        theme: ['work-life balance', 'productivity'],
        vibe: ['anxious'],
        intent: 'Test intent',
        subtext: 'Test subtext',
        persona_trait: ['analytical'],
        bucket: ['Thought']
      },
      recent_entries: [
        createMockEntry(['work-life balance'], ['driven'], differentEmbedding),
        createMockEntry(['startup culture'], ['excited'], differentEmbedding)
      ],
      embedding: mockEmbedding
    };

    const { context: result, log } = step07_carryIn(context);

    expect(result.carry_in).toBe(true);
    expect(log.tag).toBe('CARRY_IN');
    expect(log.note).toContain('Theme overlap');
    expect(log.note).toContain('work-life balance');
  });

  test('should return carry_in=true when vibes overlap', () => {
    const differentEmbedding2 = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    const context: Partial<PipelineContext> = {
      parsed: {
        theme: ['personal growth'],
        vibe: ['anxious', 'driven'],
        intent: 'Test intent',
        subtext: 'Test subtext',
        persona_trait: ['analytical'],
        bucket: ['Thought']
      },
      recent_entries: [
        createMockEntry(['startup culture'], ['driven'], differentEmbedding2),
        createMockEntry(['productivity'], ['excited'], differentEmbedding2)
      ],
      embedding: mockEmbedding
    };

    const { context: result, log } = step07_carryIn(context);

    expect(result.carry_in).toBe(true);
    expect(log.tag).toBe('CARRY_IN');
    expect(log.note).toContain('Vibe overlap');
    expect(log.note).toContain('driven');
  });

  test('should return carry_in=true when cosine similarity > 0.86', () => {
    // Create very similar embeddings (high cosine similarity)
    const similarEmbedding = mockEmbedding.map(val => val + 0.01); // Very similar

    const context: Partial<PipelineContext> = {
      parsed: {
        theme: ['different theme'],
        vibe: ['different vibe'],
        intent: 'Test intent',
        subtext: 'Test subtext',
        persona_trait: ['analytical'],
        bucket: ['Thought']
      },
      recent_entries: [
        createMockEntry(['unrelated'], ['neutral'], mockEmbedding)
      ],
      embedding: similarEmbedding
    };

    const { context: result, log } = step07_carryIn(context);

    expect(result.carry_in).toBe(true);
    expect(log.tag).toBe('CARRY_IN');
    expect(log.note).toContain('High cosine similarity');
  });

  test('should return carry_in=false when no overlap and low similarity', () => {
    // Create very different embedding
    const differentEmbedding = mockEmbedding.map(val => -val);

    const context: Partial<PipelineContext> = {
      parsed: {
        theme: ['completely different'],
        vibe: ['totally different'],
        intent: 'Test intent',
        subtext: 'Test subtext',
        persona_trait: ['analytical'],
        bucket: ['Thought']
      },
      recent_entries: [
        createMockEntry(['unrelated'], ['neutral'], differentEmbedding)
      ],
      embedding: mockEmbedding
    };

    const { context: result, log } = step07_carryIn(context);

    expect(result.carry_in).toBe(false);
    expect(log.tag).toBe('CARRY_IN');
    expect(log.note).toContain('No significant overlap');
  });

  test('should return carry_in=false when no recent entries', () => {
    const context: Partial<PipelineContext> = {
      parsed: {
        theme: ['any theme'],
        vibe: ['any vibe'],
        intent: 'Test intent',
        subtext: 'Test subtext',
        persona_trait: ['analytical'],
        bucket: ['Thought']
      },
      recent_entries: [],
      embedding: mockEmbedding
    };

    const { context: result, log } = step07_carryIn(context);

    expect(result.carry_in).toBe(false);
    expect(log.tag).toBe('CARRY_IN');
    expect(log.note).toBe('No recent entries');
  });

  test('should throw error when required context is missing', () => {
    const context: Partial<PipelineContext> = {
      parsed: undefined, // Missing required field
      recent_entries: [],
      embedding: mockEmbedding
    };

    expect(() => step07_carryIn(context)).toThrow('parsed, recent_entries, and embedding are required');
  });
});