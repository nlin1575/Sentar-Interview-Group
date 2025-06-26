import { PipelineContext, LogEntry, PipelineResult } from '../types';
/**
 * Step 12: PUBLISH
 * Package {entryId, response_text, carry_in}
 * Input: entry_id, response_text, carry_in, profile → Output: final result
 */
export declare function step12_publish(context: Partial<PipelineContext>): {
    context: Partial<PipelineContext>;
    log: LogEntry;
    result: PipelineResult;
};
//# sourceMappingURL=step12_publish.d.ts.map