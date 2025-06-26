import { PipelineResult } from './types';
/**
 * Main pipeline runner that executes all 13 steps in sequence
 * @param transcript - The diary transcript to process
 * @param userId - User identifier (defaults to 'default')
 * @returns Pipeline result with entry ID, response, and updated profile
 */
export declare function runPipeline(transcript: string, userId?: string): Promise<PipelineResult>;
//# sourceMappingURL=runPipeline.d.ts.map