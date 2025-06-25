import { PipelineContext, LogEntry } from '../types';
import { db } from '../db';

/**
 * Step 03: FETCH_RECENT
 * Load last 5 entries from storage
 * Input: → Output: recent[]
 */
export function step03_fetchRecent(context: Partial<PipelineContext>, userId: string = 'default'): { context: Partial<PipelineContext>, log: LogEntry } {
  // Fetch recent entries from database
  const recent_entries = db.getRecentEntries(userId, 5);

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    recent_entries
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'FETCH_RECENT',
    input: `userId="${userId}", limit=5`,
    output: `recent[${recent_entries.length}] entries`,
    note: recent_entries.length > 0
      ? `Found ${recent_entries.length} recent entries, latest: ${recent_entries[0]?.timestamp.toISOString()}`
      : 'No recent entries found (first-time user)'
  };

  return { context: updatedContext, log };
}