import { PipelineContext, LogEntry } from '../types';
import { db } from '../db';

/**
 * Step 03: FETCH_RECENT
 * Load last 5 entries from storage
 * Input: → Output: recent[]
 */
export function step03_fetchRecent(
  context: Partial<PipelineContext>,
  userId: string = 'default'
): { context: Partial<PipelineContext>; log: LogEntry } {
  /* 1️⃣ Fetch the five most-recent entries */
  const recent_entries = db.getRecentEntries(userId, 5);

  /* 2️⃣ Update pipeline context */
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    recent_entries
  };

  /* 3️⃣ Build a human-friendly preview list */
  const preview =
    recent_entries.length > 0
      ? recent_entries
          .map(
            (e, i) =>
              `${i + 1}. ${e.timestamp.toISOString()} – ` +
              `"${e.raw_text.slice(0, 40)}${e.raw_text.length > 40 ? '…' : ''}"`
          )
          .join('\n')
      : 'None';

  /* 4️⃣ Create log entry */
  const log: LogEntry = {
    tag: 'FETCH_RECENT',
    input: `userId="${userId}", limit=5`,
    output: `recent[${recent_entries.length}] entries`,
    note:
      recent_entries.length > 0
        ? `Found ${recent_entries.length} recent entries:\n${preview}`
        : 'No recent entries found (first-time user)'
  };

  /* Optional: also print to console for fast debugging */
  return { context: updatedContext, log };
}