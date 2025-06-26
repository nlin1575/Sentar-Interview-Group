import { PipelineContext, LogEntry } from '../types';
/**
 * Step 01: RAW_TEXT_IN
 * Accept the transcript and validate it
 * Input: transcript → Output: raw_text
 */
export declare function step01_rawTextIn(transcript: string): {
    context: Partial<PipelineContext>;
    log: LogEntry;
};
//# sourceMappingURL=step01_rawTextIn.d.ts.map