import { PipelineContext, LogEntry, DiaryEntry } from '../types';
import { db } from '../db';
import { generateTimestampId } from '../utils/nanoid';

/**
 * Step 10: SAVE_ENTRY
 * Save full object
 * Input: all context data → Output: entryId
 */
export function step10_saveEntry(context: Partial<PipelineContext>, userId: string = 'default'): { context: Partial<PipelineContext>, log: LogEntry } {
  if (!context.raw_text || !context.embedding || !context.meta_data || !context.parsed ||
      context.carry_in === undefined || context.emotion_flip === undefined) {
    throw new Error('All entry data is required for saving');
  }

  // Generate unique entry ID
  const entry_id = generateTimestampId();

  // Create complete diary entry
  const diaryEntry: DiaryEntry = {
    id: entry_id,
    raw_text: context.raw_text,
    embedding: context.embedding,
    meta_data: context.meta_data,
    parsed: context.parsed,
    timestamp: new Date(),
    carry_in: context.carry_in,
    emotion_flip: context.emotion_flip
  };

  // Save entry to database
  db.saveEntry(diaryEntry, userId);

  // Save updated profile if available
  if (context.profile) {
    db.saveProfile(context.profile, userId);
  }

  // Update context with entry ID
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    entry_id
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'SAVE_ENTRY',
    input: `entry_data (${context.raw_text.length} chars, ${context.embedding.length}D embedding)`,
    output: `entryId="${entry_id}"`,
    note: `Saved complete entry and updated profile for user "${userId}"`
  };

  return { context: updatedContext, log };
}