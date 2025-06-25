import { PipelineResult, LogEntry } from './types';
import { config } from 'dotenv';

// Load environment variables
config();

// Import all pipeline steps
import { step01_rawTextIn } from './pipeline/step01_rawTextIn';
import { step02_embedding } from './pipeline/step02_embedding';
import { step03_fetchRecent } from './pipeline/step03_fetchRecent';
import { step04_fetchProfile } from './pipeline/step04_fetchProfile';
import { step05_metaExtract } from './pipeline/step05_metaExtract';
import { step06_parseEntry } from './pipeline/step06_parseEntry';
import { step07_carryIn } from './pipeline/step07_carryIn';
import { step08_contrastCheck } from './pipeline/step08_contrastCheck';
import { step09_profileUpdate } from './pipeline/step09_profileUpdate';
import { step10_saveEntry } from './pipeline/step10_saveEntry';
import { step11_gptReply } from './pipeline/step11_gptReply';
import { step12_publish } from './pipeline/step12_publish';
import { step13_costLatencyLog } from './pipeline/step13_costLatencyLog';

/**
 * Main pipeline runner that executes all 13 steps in sequence
 * @param transcript - The diary transcript to process
 * @param userId - User identifier (defaults to 'default')
 * @returns Pipeline result with entry ID, response, and updated profile
 */
export async function runPipeline(transcript: string, userId: string = 'default'): Promise<PipelineResult> {
  const logs: LogEntry[] = [];

  try {
    console.log('\n🚀 Starting Sentari Pipeline...\n');

    // Step 01: RAW_TEXT_IN
    const { context: ctx1, log: log1 } = step01_rawTextIn(transcript);
    logs.push(log1);
    logStep(log1);

    // Step 02: EMBEDDING
    const { context: ctx2, log: log2 } = await step02_embedding(ctx1);
    logs.push(log2);
    logStep(log2);

    // Step 03: FETCH_RECENT
    const { context: ctx3, log: log3 } = step03_fetchRecent(ctx2, userId);
    logs.push(log3);
    logStep(log3);

    // Step 04: FETCH_PROFILE
    const { context: ctx4, log: log4 } = step04_fetchProfile(ctx3, userId);
    logs.push(log4);
    logStep(log4);

    // Step 05: META_EXTRACT
    const { context: ctx5, log: log5 } = step05_metaExtract(ctx4);
    logs.push(log5);
    logStep(log5);

    // Step 06: PARSE_ENTRY
    const { context: ctx6, log: log6 } = step06_parseEntry(ctx5);
    logs.push(log6);
    logStep(log6);

    // Step 07: CARRY_IN
    const { context: ctx7, log: log7 } = step07_carryIn(ctx6);
    logs.push(log7);
    logStep(log7);

    // Step 08: CONTRAST_CHECK
    const { context: ctx8, log: log8 } = step08_contrastCheck(ctx7);
    logs.push(log8);
    logStep(log8);

    // Step 09: PROFILE_UPDATE
    const { context: ctx9, log: log9 } = step09_profileUpdate(ctx8);
    logs.push(log9);
    logStep(log9);

    // Step 10: SAVE_ENTRY
    const { context: ctx10, log: log10 } = step10_saveEntry(ctx9, userId);
    logs.push(log10);
    logStep(log10);

    // Step 11: GPT_REPLY
    const { context: ctx11, log: log11 } = await step11_gptReply(ctx10);
    logs.push(log11);
    logStep(log11);

    // Step 12: PUBLISH
    const { context: ctx12, log: log12, result } = step12_publish(ctx11);
    logs.push(log12);
    logStep(log12);

    // Step 13: COST_LATENCY_LOG
    const { context: ctx13, log: log13 } = step13_costLatencyLog(ctx12);
    logs.push(log13);
    logStep(log13);

    console.log('\n✅ Pipeline completed successfully!\n');

    return result;

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    throw error;
  }
}

/**
 * Helper function to format and log each step
 */
function logStep(log: LogEntry): void {
  console.log(`[${log.tag}] input=<${log.input}> | output=<${log.output}> | note=<${log.note}>`);
}