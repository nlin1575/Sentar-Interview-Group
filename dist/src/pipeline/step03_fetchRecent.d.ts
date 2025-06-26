import { PipelineContext, LogEntry } from '../types';
/**
 * Step 03: FETCH_RECENT
 * Load last 5 entries from storage
 * Input: → Output: recent[]
 */
export declare function step03_fetchRecent(context: Partial<PipelineContext>, userId?: string): {
    context: Partial<PipelineContext>;
    log: LogEntry;
};
//# sourceMappingURL=step03_fetchRecent.d.ts.map