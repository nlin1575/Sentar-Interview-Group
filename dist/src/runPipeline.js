"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = runPipeline;
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Import all pipeline steps
const step01_rawTextIn_1 = require("./pipeline/step01_rawTextIn");
const step02_embedding_1 = require("./pipeline/step02_embedding");
const step03_fetchRecent_1 = require("./pipeline/step03_fetchRecent");
const step04_fetchProfile_1 = require("./pipeline/step04_fetchProfile");
const step05_metaExtract_1 = require("./pipeline/step05_metaExtract");
const step06_parseEntry_1 = require("./pipeline/step06_parseEntry");
const step07_carryIn_1 = require("./pipeline/step07_carryIn");
const step08_contrastCheck_1 = require("./pipeline/step08_contrastCheck");
const step09_profileUpdate_1 = require("./pipeline/step09_profileUpdate");
const step10_saveEntry_1 = require("./pipeline/step10_saveEntry");
const step11_gptReply_1 = require("./pipeline/step11_gptReply");
const step12_publish_1 = require("./pipeline/step12_publish");
const step13_costLatencyLog_1 = require("./pipeline/step13_costLatencyLog");
/**
 * Main pipeline runner that executes all 13 steps in sequence
 * @param transcript - The diary transcript to process
 * @param userId - User identifier (defaults to 'default')
 * @returns Pipeline result with entry ID, response, and updated profile
 */
async function runPipeline(transcript, userId = 'default') {
    const logs = [];
    try {
        console.log('\n🚀 Starting Sentari Pipeline...\n');
        // Step 01: RAW_TEXT_IN
        const { context: ctx1, log: log1 } = (0, step01_rawTextIn_1.step01_rawTextIn)(transcript);
        logs.push(log1);
        logStep(log1);
        // Step 02: EMBEDDING
        const { context: ctx2, log: log2 } = await (0, step02_embedding_1.step02_embedding)(ctx1);
        logs.push(log2);
        logStep(log2);
        // Step 03: FETCH_RECENT
        const { context: ctx3, log: log3 } = (0, step03_fetchRecent_1.step03_fetchRecent)(ctx2, userId);
        logs.push(log3);
        logStep(log3);
        // Step 04: FETCH_PROFILE
        const { context: ctx4, log: log4 } = (0, step04_fetchProfile_1.step04_fetchProfile)(ctx3, userId);
        logs.push(log4);
        logStep(log4);
        // Step 05: META_EXTRACT
        const { context: ctx5, log: log5 } = (0, step05_metaExtract_1.step05_metaExtract)(ctx4);
        logs.push(log5);
        logStep(log5);
        // Step 06: PARSE_ENTRY
        const { context: ctx6, log: log6 } = await (0, step06_parseEntry_1.step06_parseEntry)(ctx5);
        logs.push(log6);
        logStep(log6);
        // Step 07: CARRY_IN
        const { context: ctx7, log: log7 } = (0, step07_carryIn_1.step07_carryIn)(ctx6);
        logs.push(log7);
        logStep(log7);
        // Step 08: CONTRAST_CHECK
        const { context: ctx8, log: log8 } = (0, step08_contrastCheck_1.step08_contrastCheck)(ctx7);
        logs.push(log8);
        logStep(log8);
        // Step 09: PROFILE_UPDATE
        const { context: ctx9, log: log9 } = (0, step09_profileUpdate_1.step09_profileUpdate)(ctx8);
        logs.push(log9);
        logStep(log9);
        // Step 10: SAVE_ENTRY
        const { context: ctx10, log: log10 } = (0, step10_saveEntry_1.step10_saveEntry)(ctx9, userId);
        logs.push(log10);
        logStep(log10);
        // Step 11: GPT_REPLY
        const { context: ctx11, log: log11 } = await (0, step11_gptReply_1.step11_gptReply)(ctx10);
        logs.push(log11);
        logStep(log11);
        // Step 12: PUBLISH
        const { context: ctx12, log: log12, result } = (0, step12_publish_1.step12_publish)(ctx11);
        logs.push(log12);
        logStep(log12);
        // Step 13: COST_LATENCY_LOG
        const { context: ctx13, log: log13 } = (0, step13_costLatencyLog_1.step13_costLatencyLog)(ctx12);
        logs.push(log13);
        logStep(log13);
        console.log('\n✅ Pipeline completed successfully!\n');
        return result;
    }
    catch (error) {
        console.error('\n❌ Pipeline failed:', error);
        throw error;
    }
}
/**
 * Helper function to format and log each step
 */
function logStep(log) {
    console.log(`[${log.tag}] input=<${log.input}> | output=<${log.output}> | note=<${log.note}>`);
}
//# sourceMappingURL=runPipeline.js.map