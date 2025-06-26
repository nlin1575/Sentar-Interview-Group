import { PipelineContext, LogEntry } from '../types';
/**
 * Step 02: EMBEDDING
 * Create n-dimensional MiniLM vector (or mock)
 * Input: raw_text → Output: embedding[n]
 */
export declare function step02_embedding(context: Partial<PipelineContext>): Promise<{
    context: Partial<PipelineContext>;
    log: LogEntry;
}>;
//# sourceMappingURL=step02_embedding.d.ts.map