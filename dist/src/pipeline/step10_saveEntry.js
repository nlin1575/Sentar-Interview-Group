"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step10_saveEntry = step10_saveEntry;
const db_1 = require("../db");
const nanoid_1 = require("../utils/nanoid");
/**
 * Step 10: SAVE_ENTRY
 * Save full object
 * Input: all context data → Output: entryId
 */
function step10_saveEntry(context, userId = 'default') {
    if (!context.raw_text || !context.embedding || !context.meta_data || !context.parsed ||
        context.carry_in === undefined || context.emotion_flip === undefined) {
        throw new Error('All entry data is required for saving');
    }
    // Generate unique entry ID
    const entry_id = (0, nanoid_1.generateTimestampId)();
    // Create complete diary entry
    const diaryEntry = {
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
    db_1.db.saveEntry(diaryEntry, userId);
    // Save updated profile if available
    if (context.profile) {
        db_1.db.saveProfile(context.profile, userId);
    }
    // Update context with entry ID
    const updatedContext = {
        ...context,
        entry_id
    };
    // Create log entry
    const log = {
        tag: 'SAVE_ENTRY',
        input: `entry_data (${context.raw_text.length} chars, ${context.embedding.length}D embedding)`,
        output: `entryId="${entry_id}"`,
        note: `Saved complete entry and updated profile for user "${userId}"`
    };
    return { context: updatedContext, log };
}
//# sourceMappingURL=step10_saveEntry.js.map